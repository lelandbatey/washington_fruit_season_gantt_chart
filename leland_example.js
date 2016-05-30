
// Returns a promise which resolves with the raw seasonal fruit data in json
// format.
function fetch_raw_seasonjson() { return new Promise((resolve, reject) => {
    var json_url = "washington_grown_fruits_legume_and_herbs.json";
    $.ajax({
        url: json_url,
        success: resolve,
        error: reject
    });
});};

function continuize_months(entry) {
    var ranges = [];
    var within_continue = false;
    var start;
    var end;

    var year = moment().subtract(1, 'year').startOf('year');
    _.forIn(entry['months'], (is_in_season, month) => {
        month = +month - 1;
        if (is_in_season) {
            if (!within_continue) {
                within_continue = true;
                start = moment(year).month(month).startOf('month');
            }
            end = moment(year).month(month).endOf('month');
        } else {
            if (within_continue) {
                within_continue = false;
                ranges.push({
                    'start': start,
                    'end': end
                });
                start = null;
                end = null;
            }
        }
    });

    if (within_continue) {
        ranges.push({
            'start': start,
            'end': end
        });
    }

    _.forIn(ranges, (range, idx) => {
        console.log();
        var diff = range.end.diff(range.start, 'years', true);
        if (diff > 0.9) {
            delete ranges[idx];
        }
    });

    console.log();
    return ranges;
}

// Transforms the raw json seasonality data into the task-oriented structure
// for use with the gantt-chart library
function seasons_to_tasks(fruit_seasons) {
    var rv = [];
    _.forIn(fruit_seasons, (entry, key) => {
        _.forIn(continuize_months(entry), (range) => {
            if (!range) {
                return;
            }
            var taskName = entry['Produce'];
            var taskStatus = "SUCCEEDED";
            rv.push({
                "taskName": taskName,
                "status": taskStatus,
                "startDate": range.start.toDate(),
                "endDate": range.end.toDate()
            });
        });
        //_.forIn(entry['months'], (is_in_season, active_month) => {
            //if (is_in_season) {
                //// In the json the months are 1-indexed, but to create accurate
                //// dates they must be 0-indexed, so subtract 1 from each.
                //active_month = +active_month - 1;

                //var year = moment().subtract(1, 'year').startOf('year');
                //var start = moment(year).month(active_month).startOf('month');
                //var end = moment(start).endOf("month");

                //var taskName = entry['Produce'];
                //var taskStatus = "SUCCEEDED";
                //rv.push({
                    //"taskName": taskName,
                    //"status": taskStatus,
                    //"startDate": start.toDate(),
                    //"endDate": end.toDate()
                //});
            //}
        //});
    });
    return rv;
}

function gather_task_names(gantt_data) {
    var rv = [];
    _.each(gantt_data, (task) => {
        var name = task['taskName'];
        if (rv.indexOf(name) == -1) {
            rv.push(name);
        }
    });
    //console.log(rv);
    return rv;
}


function init() {
    console.log("Attempting to run promise!");
    fetch_raw_seasonjson().then((data) => {
        console.log("Data:", seasons_to_tasks(data));
        var gantt_data = seasons_to_tasks(data);
        var taskStatus = {
            "SUCCEEDED" : "bar",
            "FAILED" : "bar-failed",
            "RUNNING" : "bar-running",
            "KILLED" : "bar-killed"
        };
        var taskNames = gather_task_names(gantt_data);
        var format = "%B";

        gantt_data.sort(function(a, b){
            return a.endDate - b.endDate;
        });

        var gantt = d3.gantt().taskTypes(taskNames).taskStatus(taskStatus).tickFormat(format);
        //gantt(gantt_data.slice(0, 2));
        gantt(gantt_data);

        console.log("Start of month 1", moment().month(1));

    }).catch((data) => {
        console.log("Promise was rejected with data:", data);
    });
}


$(document).ready(init);


