// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

require(["jquery", "jhapi", "utils"], function (
  $,
  JHAPI,
  utils,
) {
  "use strict";

  var base_url = window.jhdata.base_url;
  var user = window.jhdata.user;
  var api = new JHAPI(base_url);

  function cancelServer(event) {
    event.preventDefault();
    event.stopPropagation();

    var tr = getRow($(this));
    disableRow(tr);

    var id = tr.data("server-id");
    api.cancel_named_server(user, id, {
      success: function () {
        enableRow(tr, false);
        // If cancelling, we want to keep the progress indicator,
        // so we do not reset the progress bar
      },
    });
  }

  function stopServer(event) {
    event.preventDefault();
    event.stopPropagation();

    var tr = getRow($(this));
    disableRow(tr);

    var id = tr.data("server-id");
    api.stop_named_server(user, id, {
      success: function () {
        enableRow(tr, false);
        resetProgress($(`#${id}-progress-bar`), $(`#${id}-progress-info-text`), "bg-success");
      },
    });
  }

  function deleteServer(event) {
    event.preventDefault();
    event.stopPropagation();

    var collapsible_row = getRow($(this));
    disableRow(collapsible_row);

    var id = collapsible_row.data("server-id");
    api.delete_named_server(user, id, {
      success: function () {
        $(`tr[data-server-id=${id}]`).each(function () {
          $(this).remove();
        })
      },
    });
  }

  function startServer(event) {
    event.preventDefault();
    event.stopPropagation();

    var tr = getRow($(this));
    var collapse = getCollapsibleTr(tr);
    // Update the summary row according to the values set in the collapse
    updateTr(collapse, tr);
    disableRow(tr);

    var id = tr.data("server-id");
    var display_name = tr.find("th").text();
    // Automatically set name if none was specified
    if (display_name == "") display_name = "Unnamed JupyterLab";
    // Set the href of the start button to the spawn url
    var url = utils.url_path_join(base_url, "spawn", user, id);
    $(this).attr("href", url);

    // Validate the form and start spawn only after validation
    try {
      // Check if all user inputs are valid and filled, if required
      $(`form[id*=${id}]`).submit();

      var progressBar = $(`#${id}-progress-bar`);
      var progressInfo = $(`#${id}-progress-info-text`);
      var progressLog = $(`#${id}-progress-log`);
      var logSelect = $(`#${id}-log-select`);
      resetProgress(progressBar, progressInfo, "bg-success bg-danger");
      progressLog.html("");

      var options = createDataDict(collapse, display_name);
      // Open a new tab for spawn_pending.html
      // Need to create it here for context reasons
      var newTab = window.open("about:blank");
      api.start_named_server(user, id, {
        data: JSON.stringify(options),
        success: function () {
          // Save latest log to time stamp and empty it
          updateSpawnEventsDict(id, logSelect);
          // Open the spawn url in the new tab
          newTab.location.href = url;
          // Hook up event-stream for progress
          var progress_url = utils.url_path_join(jhdata.base_url, "api/users", jhdata.user, "servers", id, "progress");
          if (!(id in evtSources)) {
            evtSources[id] = new EventSource(progress_url);
            evtSources[id].onmessage = function (e) {
              onEvtMessage(e, evtSources[id], id);
            }
          }
          // Successfully sent request to start the lab, enable row again
          enableRow(tr, true);
        },
        error: function (xhr, textStatus, errorThrown) {
          newTab.close();
          updateProgress(progressBar, progressInfo, 100, "last spawn failed", "bg-danger", false);  // showProgress = false
          progressLog.append($("<div>").html(
            `Could not request spawn. Error: ${xhr.status} ${errorThrown}`)
          )
          // Spawn attempt finished, enable row again
          enableRow(tr, false);
        }
      });
    }
    // Something went wrong, most likely form check didn't pass
    catch (e) {
      enableRow(tr, false);
    }
  }

  function startNewServer() {
    function uuidv4() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }

    function uuidv4hex() {
      return ([1e7, 1e3, 4e3, 8e3, 1e11].join('')).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    }

    function uuid_with_letter_start() {
      let uuid = uuidv4hex();
      let char = Math.random().toString(36).match(/[a-zA-Z]/)[0];
      return char + uuid.substring(1);
    }

    var id = uuid_with_letter_start();
    var display_name = $("#new_jupyterlab-name-input").val();
    // Automatically set name if none was specified
    if (display_name == "") display_name = "Unnamed JupyterLab";

    // Disable start button
    var start_button = $(this);
    start_button.attr("disabled", true);
    var spinner = start_button.children().children("div.spinner-border");
    spinner.removeClass("d-none");
    var alert = start_button.siblings(".alert");

    var url = utils.url_path_join(base_url, "spawn", user, id);
    $(this).attr("href", url);

    var parent = $("#new_jupyterlab-dialog").find(".modal-content");
    var options = createDataDict(parent, display_name);

    try {
      // Check if all user inputs are valid and filled, if required
      $("form[id*=new_jupyterlab]").submit();
      // Show information about start attemps
      alert.children("span").text(`Waiting for ${display_name} to start...`);
      alert.removeClass("alert-danger").addClass("show alert-dark");
      // Open a new tab for spawn_pending.html
      // Need to create it here for context reasons
      var newTab = window.open("about:blank");

      api.start_named_server(user, id, {
        data: JSON.stringify(options),
        success: function () {
          newTab.location.href = url;
          var myModal = $("#new_jupyterlab-dialog");
          var modal = bootstrap.Modal.getInstance(myModal);
          modal.hide();
          start_button.removeAttr("disabled");
          spinner.addClass("d-none");
          alert.removeClass("show");
          // Reload page to add spawner to table
          location.reload();
        },
        error: function (xhr, textStatus, errorThrown) {
          newTab.close();
          spinner.addClass("d-none");
          start_button.removeAttr("disabled");
          // Show information about why the start failed
          alert.removeClass("alert-dark").addClass("show alert-danger");
          alert.children("span").text(`Could not start ${display_name}. Error: ${xhr.status} ${errorThrown}`);
        }
      });
    }
    // Something went wrong, most likely form check didn't pass
    catch (e) {
      $(this).removeAttr("disabled");
    }
  }

  function openServer(event) {
    event.preventDefault();
    event.stopPropagation();

    var url = $(this).data("server-url");
    window.open(url, "_blank");
  }

  $(".start").click(startServer);
  $("#new_jupyterlab-start-btn").click(startNewServer);
  $(".open").click(openServer);
  $(".cancel").click(cancelServer);
  $(".stop").click(stopServer);
  $(".delete").click(deleteServer);


  /*
  Validate form before starting a new lab
  */
  $("form").submit(function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (!$(this)[0].checkValidity()) {
      $(this).addClass('was-validated');
      // Show the tab where the error was thrown
      var tab_id = $(this).attr("id").replace("-form", "-tab");
      var tab = new bootstrap.Tab($("#" + tab_id));
      tab.show();
      // Open the collapse if it was hidden
      var collapse = $(this).parents(".collapse");
      var first_td = $(this).parents("tr").prev().find("td.details");
      var icon = first_td.children(".accordion-icon");
      var hidden = collapse.css("display") == "none" ? true : false;
      if (hidden) {
        icon.removeClass("collapsed");
        new bootstrap.Collapse(collapse);
      }
      throw {
        name: "FormValidationError",
        toString: function () {
          return this.name;
        }
      };
    } else {
      $(this).removeClass('was-validated');
    }
  });


  /*
  Save and revert changes to spawner
  */
  function saveChanges() {
    var collapse = $(this).parents(".collapse");
    var tr = $(this).parents("tr").prev();
    var alert = $(this).siblings(".alert");

    var id = get_id($(this));
    var display_name = collapse.find("input[id*=name]").val();
    var options = createDataDict(collapse, display_name);

    api.update_named_server(user, id, {
      data: JSON.stringify(options),
      success: function () {
        // Update table data entries
        updateTr(collapse, tr);
        // Update user options
        user_options[id] = options;
        // Update alert message
        alert.children("span").text(`Successfully updated ${display_name}.`);
        alert.removeClass("alert-danger pe-none");
        alert.addClass("alert-success show");
        // Disable edit buttons again
        $(`#${id}-save-btn, #${id}-reset-btn`).attr("disabled", true);
      },
      error: function (xhr, textStatus, errorThrown) {
        alert.children("span").text(`Could not update ${display_name}. Error: ${xhr.status} ${errorThrown}`);
        alert.removeClass("alert-success pe-none");
        alert.addClass("alert-danger show");
      }
    });
  }

  function revertChanges() {
    var collapse = $(this).parents(".collapse");
    var tr = $(this).parents("tr").prev();
    var alert = $(this).siblings(".alert");

    var id = get_id($(this));
    var display_name = collapse.find("input[id*=name]").val();
    var options = user_options[id];

    api.update_named_server(user, id, {
      data: JSON.stringify(options),
      success: function () {
        // setValues and removeWarning from home.html
        setValues(id, user_options[id]);
        // Update table data entries
        updateTr(collapse, tr);
        // Show first tab after resetting values
        var trigger = $("#" + id + "-service-tab");
        var tab = new bootstrap.Tab(trigger);
        tab.show();
        // Update alert message
        alert.children("span").text(`Successfully reverted settings back for ${display_name}.`);
        alert.removeClass("alert-danger pe-none");
        alert.addClass("alert-success show");
        // Disable edit buttons again
        $(`#${id}-save-btn, #${id}-reset-btn`).attr("disabled", true);

      },
      error: function (xhr, textStatus, errorThrown) {
        alert.children("span").text(`Could not update ${display_name}. Error: ${xhr.status} ${errorThrown}`);
        alert.removeClass("alert-success pe-none");
        alert.addClass("alert-danger show");
      }
    });
  }

  $(".save").click(saveChanges);
  $(".reset").click(revertChanges);

  /*
  Util functions
  */
  function createDataDict(parent, display_name) {
    var user_options = {}
    user_options["vo"] = $("#vo-form input[type='radio']:checked").val();
    user_options["name"] = display_name;

    function addParameter(param, element = "select") {
      if (element == "input") {
        var input = parent.find(`input[id*=${param}]`);
        var parent_div = input.parents(".row").first();
        if (parent_div.css("display") == "none") {
          return;
        }
        var value = input.val();
        if (param == "runtime") {
          value = value * 60;
        }
      }
      else if (element == "checkbox") {
        var checkboxes = parent.find(`input[type=checkbox]`);
        var value = [];
        checkboxes.each(function () {
          if (this.checked) value.push($(this).val());
        });
      }
      else { // <select>
        var select = parent.find(`select[id*=${param}]`);
        var value = select.val();
        if (param == "version") {
          value = "JupyterLab/" + value;
          user_options["service"] = value;
          return;
        }
      }
      if (value != null) user_options[param] = value;
    }

    addParameter("version"); // service
    addParameter("system");
    addParameter("account");
    addParameter("project");
    addParameter("partition");
    addParameter("reservation");
    addParameter("nodes", "input");
    addParameter("gpus", "input");
    addParameter("runtime", "input");
    addParameter("additional_spawn_options", "checkbox");
    return user_options;
  }

  function updateTr(collapse, tr) {
    var name_td = tr.find("th");
    var system_td = tr.find(".system-td");
    system_td.text(collapse.find("select[id*=system]").val());
    var partition_td = tr.find(".partition-td");
    partition_td.text(collapse.find("select[id*=partition]").val());
    var project_td = tr.find(".project-td");
    project_td.text(collapse.find("select[id*=project]").val());
    // Special handing of display name
    // Automatically set name if none was specified
    var display_name = collapse.find("input[id*=name]").val();
    if (display_name == "") display_name = "Unnamed JupyterLab";
    name_td.text(display_name);
  }
});
