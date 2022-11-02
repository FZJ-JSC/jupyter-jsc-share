/**
 * Update styling of the progress bar and the text of the corresponding progress info text.
 * @param {Object} progressBar progress bar to update
 * @param {Object} progressInfo info div for which the text is to be updated
 * @param {Number} progress amount of progress in percent
 * @param {String} progressText info text
 * @param {String} progressBackground background of progress bar to set
 * @param {Boolean} showProgress if the progress number should be shown in the progress bar
 */
function updateProgress(progressBar, progressInfo, progress,
  progressText, progressBackground = "", showProgress = true) {
  progressBar
    .width(100)
    .attr("aria-valuenow", progress)
    .removeClass(".bg-danger .bg-success")
    .addClass(progressBackground);
  if (showProgress) progressBar.html(`<b>${progress}%</b>`);
  else progressBar.html("");

  progressInfo.html(progressText);
}

/**
 * Resets the width and background of a progress bar as well as its info text.
 * @param {Object} progressBar progress bar to update
 * @param {Object} progressInfo info div for which the text is to be updated
 * @param {String} progressBackground which background classes to remove
 */
function resetProgress(progressBar, progressInfo, progressBackground) {
  progressBar.width(0).html("");
  progressBar.removeClass(progressBackground);
  progressInfo.html("");
}

/**
 * Appends messages to a progress log. Avoids duplicate messages.
 * @param {String} html_message log message, may be an html string e.g. "<b>bold text</b>"
 * @param {Object} progressLog progress log div to append a message to
 */
function appendToLog(html_message, progressLog) {
  // Get already appended messages
  var current_messages = [];
  progressLog.children().each(function () {
    var current_html = $(this).children().first();
    current_messages.push(current_html.text());
  })
  try {
    var html_text = $(html_message).text();
  }
  catch {
    var html_text = html_message;
  }
  // and only append if message has not been logged yet
  if (!current_messages.includes(html_text)) {
    progressLog.append($('<div class="log-div">').html(html_message));
  }
}

/**
 * Handler for new JupyterLab started events.
 * @param {Object} e event received by evtSource
 */
function newJupyterLabStarted(e) {
  // Contains a list of all currently spawning JupyterLabs
  var data = JSON.parse(e.data);
  for (const id in data) {
    // Catch the case when a JupyterLab is not in the spawn_event dictionary
    // since there would be no log interface for it in that case.
    if (!(id in spawn_events)) {
      location.reload();
      return;
    }
    // We are not listening to the spawn events of the JupyterLab yet.
    if (!(id in evtSources)) {
      var progress_url = `${jhdata.base_url}api/users/${jhdata.user}/servers/${id}/progress`;

      // Save latest logs and update log select
      updateSpawnEventsDict(id, $(`#${id}-log-select`));

      evtSources[id] = new EventSource(progress_url);
      evtSources[id].onmessage = function (e) {
        onEvtMessage(e, evtSources[id], id);
      }
      // New spawn, so reset progress bar and log
      resetProgress($(`#${id}-progress-bar`), $(`#${id}-progress-info-text`), "bg-success bg-danger")
      $(`#${id}-progress-log`).html("");
      // Update buttons to reflect pending state
      var row = $(`tr[data-server-id=${id}]`).not(".collapse-tr");
      enableRow(row, true);
    }
  }
}

/**
 * Handler for JupyterLab stopped events.
 * @param {Object} e event received by evtSource
 */
function JupyterLabStopped(e) {
  // Contains a list of all currently stopping JupyterLabs
  var data = JSON.parse(e.data);
  for (const id in data) {
    // Append the last event 
    const html_message = data[id].html_message;
    appendToLog(html_message, $(`#${id}-progress-log`));
    // Update buttons to reflect stopped state
    var row = $(`tr[data-server-id=${id}]`).not(".collapse-tr");
    enableRow(row, false);
  }
}


/**
 * Moves the current log to a time stamp in `spawn_events` and
 * created a new empty list of events for the `latest` entry.
 * @param {String} id JupyterLab UUID
 * @param {Object} logSelect jquery select of the log dropdown
 * @returns 
 */
function updateSpawnEventsDict(id, logSelect) {
  // Save latest log to time stamp and empty it
  const start_event = spawn_events[id]["latest"][0];
  if (!start_event) return;
  const start_message = start_event.html_message;
  var re = /([0-9]+(_[0-9]+)+).*[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,3})?/;
  var start_time = re.exec(start_message)[0];
  spawn_events[id][start_time] = spawn_events[id]["latest"];
  spawn_events[id]["latest"] = [];
  logSelect.append(`<option value="${start_time}">${start_time}</option>`);
}