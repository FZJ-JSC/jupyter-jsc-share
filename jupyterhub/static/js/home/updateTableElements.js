/**
 * Get row for an element in the JupyterLab configurations table.
 * @param {Object} element jquery element
 * @returns the table row in which the button resides
 */
function getRow(element) {
  return element.parents("tr");
}

/**
 * Disables all buttons in a given table row.
 * @param {Object} tr jquery table row
 */
function disableRow(tr) {
  // Disable buttons
  tr.find("button").addClass("disabled");
}

/**
 * Enables buttons in a given table row depending
 * on if the JupyterLab of the table row is running or not.
 * @param {Object} tr jquery table row
 * @param {Boolean} running if the JupyterLab is running
 */
function enableRow(tr, running) {
  var na = tr.find(".na-status").text();
  // Enable all buttons in the first step
  tr.find("button").removeClass("disabled");

  // Now check which buttons should be hidden or disabled again
  // Show open/cancel/stop for running labs
  if (running) {
    tr.find(".na, .start").addClass("d-none");
    tr.find(".open, .cancel").removeClass("d-none");
    // Disable until fitting event received from EventSource
    tr.find(".open, .cancel").addClass("disabled");
  }
  // Show start or na for non-running labs
  else {
    // JupyterLab can't be started
    if (na != "0") {
      tr.find(".na").removeClass("d-none");
      tr.find(".start").addClass("d-none");
    }
    else {
      tr.find(".na").addClass("d-none")
      tr.find(".start").removeClass("d-none");
    }
    tr.find(".open, .cancel, .stop").addClass("d-none");
  }
}

/**
 * Returns the collapsible table row for a given JupyterLab table row.
 * @param {Object} tr jquery table row
 * @returns jquery table row
 */
function getCollapsibleTr(tr) {
  var id = tr.data("server-id");
  return tr.siblings(`.collapse-tr[data-server-id=${id}]`);
}

/**
 * Toggles the collapsible table rows.
 * To be used with a click handler for the non collapsible table rows.
 */
function toggleCollapsibleRow() {
  var collapsibleTr = $(this).next();
  var collapse = collapsibleTr.find(".collapse");
  var accordionIcon = $(this).find(".accordion-icon");
  var shouldShow = collapse.css("display") == "none" ? true : false;

  if (shouldShow) accordionIcon.removeClass("collapsed");
  else accordionIcon.addClass("collapsed");
  new bootstrap.Collapse(collapse);
}

/**
 * Disables or hides (vertical) tabs.
 * @param {String} id JupyterLab UUID
 * @param {String} tab_key which tab should be targeted, e.g. resources, reservation or modules
 * @param {Boolean} disable if the tab should be disabled
 * @param {Boolean} hide if the tab should be hidden entirely
 */
function toggleTab(id, tab_key, disable = false, hide = false) {
  var tab = $(`#${id}-${tab_key}-tab`);
  if (disable) {
    tab.addClass("disabled");
    // Hide tab warning
    toggleTabWarning(tab, false);
  }
  else tab.removeClass("disabled");
  if (hide) tab.addClass("d-none");
  else tab.removeClass("d-none");
}

/**
 * Checks if a tab warning can be removed.
 * Need this function in case the warning indicates a input element being removed
 * and we want to show the change, but the user can't click the input anymore.
 * To be used with a click handler on the vertical tabs.
 */
function checkTabWarning() {
  var target = $(this).data("bs-target");
  var tabPane = $(target);
  var shouldShow = false;
  tabPane.find("[id*=warning").each(function (i, badge) {
    var parent_div = $(badge).parents("div").first();
    if ($(badge).css("display") != "none" && parent_div.css("display") != "none") {
      // At least one badge is still shown in the tab pane,
      // so we cannot hide the tab warning and don't need to check further.
      shouldShow = true;
      return;
    }
  });
  toggleTabWarning($(this), shouldShow);
}

/**
 * Toggles the log tab.
 * To be used with a click handler on the log buttons or info texts.
 * @param {Object} event eventData
 */
function openLogTab(event) {
  var tr = $(this).parents("tr");
  var collapsibleTr = tr.next();
  var collapse = collapsibleTr.find(".collapse");
  var shouldShow = collapse.css("display") == "none" ? true : false;
  var id = tr.data("server-id");

  // Prevent collapse from closing if it is already open,
  // but not showing the logs tab.
  if (!shouldShow && !$(`#${id}-logs-tab`).hasClass("active")) {
    event.preventDefault();
    event.stopPropagation();
  }
  // Don't change to the tab if the collapse is being closed.
  else if (!shouldShow) return;
  // Change to the log tab
  var trigger = $(`#${id}-logs-tab`);
  var tab = new bootstrap.Tab(trigger);
  tab.show();
}