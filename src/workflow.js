const axiosDefault = require("axios");
const _ = require("underscore");

const CSVtoJSON = (strData, strDelimiter) => {
  strDelimiter = strDelimiter || ",";
  if (strData.substr(-1) !== "\n") strData += "\n";

  let objPattern = new RegExp(
    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + '(?:"([^"]*(?:""[^"]*)*)"|' + '([^"\\' + strDelimiter + "\\r\\n]*))",
    "gi"
  );

  const jsonData = [];
  let arrMatches = null;
  let keys = [];
  let row = [];

  while ((arrMatches = objPattern.exec(strData))) {
    const strMatchedDelimiter = arrMatches[1];

    const newRow = strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter;

    if (newRow) {
      if (!keys.length) {
        keys = row;
      } else {
        let data = {};
        for (let i in row) {
          data[keys[i]] = row[i];
        }
        jsonData.push(data);
      }
      row = [];
    }

    let strMatchedValue;
    if (arrMatches[2]) {
      strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
    } else {
      strMatchedValue = arrMatches[3];
    }
    row.push(strMatchedValue);
  }
  return jsonData;
};

exports.main = async (event, callback) => {
  try {
    const axios = axiosDefault.create({
      baseURL: "https://api.hubapi.com",
      params: {
        hapikey: process.env.HS_API_KEY,
      },
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    const { data: file } = await axiosDefault.get(
      "https://gist.githubusercontent.com/NickDeckerDevs/92f673c76212d7034c52c9353ccf94ea/raw/94519de9a4a4c605282c4ec96ddb926f72876569/alltheseitesmascsv.csv",
      { responseType: "blob" }
    );
    const tasks = CSVtoJSON(file);

    let interation = 0;
    for await (const task of tasks) {
      try {
        interation++;
        console.log(interation);

        if (interation % 20 === 0) {
          // Every 20 interation for 5 seconds
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        const properties = {
          hs_timestamp: task.due_date * 1000,
          hs_task_body: task.details,
          hubspot_owner_id: task["Owner ID"],
          hs_task_subject: task.name,
          hs_task_status: "WAITING",
          hs_task_priority: "NONE",
        };

        const createTask = await axios.post("/crm/v3/objects/tasks", { properties });
        const contactId = task["Deal ID"];
        const taskId = createTask.data.id;

        await axios.put(`/crm/v3/objects/tasks/${taskId}/associations/contacts/${contactId}/204`);
      } catch (err) {
        console.log(err);
      }
    }

    callback({
      outputFields: {
        tasks,
        error: false,
      },
    });
  } catch (err) {
    console.log(err);
    callback({
      outputFields: {
        error: true,
      },
    });
  }
};
