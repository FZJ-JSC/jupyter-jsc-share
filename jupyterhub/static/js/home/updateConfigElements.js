
/**
* Gets the id given an element
* @param {Object} element jquery element 
* @param {Number} slice_index slice index, default is -2
* @returns {String} id of the element
*/
function get_id(element, slice_index = -2) {
  var id_array = element.attr("id").split('-');
  var id = id_array.slice(0, slice_index).join('-');
  return id;
}

/**
 * Reset children and styling of a select element.
 * @param {Object} select jquery element
 * @param {Boolean} required set to true if a value is required for a form element
 */
function resetSelect(select, required = true) {
  select.html(""); // Remove any existing options
  select.removeClass("text-muted disabled");
  select.attr("required", required);
}

/**
* Reset children and styling of an input element.
* @param {Object} select jquery element
* @param {Boolean} required set to true if a value is required for a form element
*/
function resetInput(input, required = false) {
  input.val(null);
  input.attr("required", required);
}

/**
  * Update the styling of a select element depending 
  * on its available options and select an option.
  * 
  * @param  {Object} select jquery select element
  * @param  {String} value to be set. If null, the first option available is selected.
  * @param  {String} current_val current value of the element
  */
function updateSelect(select, value, current_val) {
  // For some systems, e.g. cloud, some options are not available
  if (select.html() == "") {
    select.append("<option disabled>Not available</option>");
    select.addClass("text-muted").removeAttr("required");
  }

  // Check how many options a select has
  var numberOfOptions = select.children().length
  // If there is only one option, we disable the dropdown
  if (numberOfOptions == 1) {
    select.addClass("disabled");
    // Since the dropdown cannot be clicked anymore, we need to 
    // register the onFocus function to its div instead.
  }

  // If a value != null has been passed, we select that value
  if (value) {
    select.val(value);
  }
  // No value has been passed
  else {
    // We check if the current value is contained in the new options
    select.children().each(function (i, option) {
      if ($(option).val() == current_val) {
        select.val(current_val);
        return;
      }
      // The current value doesn't exist anymore, we select 
      // the first available option as the new option.
      select.prop("selectedIndex", 0);
      toggleWarning(select, true);
    })
  }
  // In all cases, dispatch a change event 
  // so that onChange functions get triggered
  select[0].dispatchEvent(new Event("change"));
}

/**
 * Update the styling of an input element depending on passed attributes and set the value.
 * @param {Object} input jquery number input object
 * @param {Number} value to be set
 * @param {Number} current_val current value of the element
 * @param {Number} min min value allowed for number input
 * @param {Number} max max value allowed for number input
 * @param {Boolean} required set to true if a value is required for a form element
 */
function updateInput(input, value, current_val, min, max, required = true) {
  input.attr({ "min": min, "max": max, "value": value });
  input.attr("required", required);
  // Set message for invalid feedback
  input.siblings(".invalid-feedback")
    .text(`Please choose a number between ${min} and ${max}.`);

  // A value has already been set
  if (current_val != "") {
    // Check if we can keep the old value
    if (current_val >= min && current_val <= max) {
      input.val(current_val);
    }
    // Otherwise, set the new (default) value
    else {
      input.val(value);
      toggleWarning(input, true);
    }
  }
  // No current value has been set yet
  else {
    input.val(value);
    toggleWarning(input, true);
  }
}

/**
 * Update the styling of a checkbox element and set the value.
 * @param {Object} checkbox jquery checkbox object
 * @param {Number} value value to be set
 * @param {Number} current_val current value of the element
 */
function updateCheckbox(checkbox, value, current_val) {
  // A value has already been set.
  if (current_val != null) {
    // So we can keep the old value.
    // Still need to set it since we the recreated the checkbox.
    checkbox[0].checked = current_val;
  }
  // No current value has been set yet, this checkbox is new
  else {
    checkbox[0].checked = value;
    toggleWarning(checkbox, true, false);
  }
}

/**
 * Show the warning badge and optionally add a warning border to the element.
 * @param {Object} input config ui element, e.g. select, input or checkbox 
 * @param {Boolean} show if a warning should be shown
 * @param {Boolean} border if a warning border should be shown
 */
function toggleWarning(input, show = true, border = true) {
  var idArray = input.attr("id").split('-')
  idArray.splice(-1, 1, "warning"); // replace -input with -warning
  var warningId = idArray.join('-');
  var tabPaneId = input.parents(".tab-pane").attr("id");
  var tab = $(`a[data-bs-target*=${tabPaneId}`);
  if (show) {
    $(`#${warningId}`).show();
    if (border) input.addClass("border-warning");
    toggleTabWarning(tab, show);
  }
  else {
    $(`#${warningId}`).hide();
    input.removeClass("border-warning");
    // Whenever we remove a warning, we should check if we should
    // also remove the warning badge from the tab, i.e. if no 
    // warning badges are shown anymore in the corresponding tab pane.
    var shouldShow = false;
    var tabPane = input.parents(".tab-pane");
    tabPane.find("[id*=warning").each(function (i, badge) {
      if ($(badge).css("display") != "none") {
        // At least one badge is still shown in the tab pane,
        // so we cannot hide the tab warning and don't need to check further.
        shouldShow = true;
        return;
      }
    });
    toggleTabWarning(tab, shouldShow);
  }
}

/**
 * Toggles the warning in the (vertical) tab.
 * @param {Object} tab jquery tab element
 * @param {Boolean} show if the warning in the tab should be shown or hidden
 */
function toggleTabWarning(tab, show = true) {
  var tabWarning = tab.children("[id*=warning]");
  // Never show warning for tabs that are disabled
  if (tab.hasClass("disabled")) tabWarning.hide();
  else if (show) tabWarning.show();
  else tabWarning.hide();
}

/**
 * Create a html string for a checkbox with label and info + warning icons.
 * @param {String} id JupyterLab UUID
 * @param {String} key key and value of the checkbox
 * @param {String} label text for label of the checkbox
 * @param {String} href url for the checkbox info icon
 * @param {Number} col Number of columns the checkbox should span
 * @returns {String} html string containing checkbox with label and icons
 */
function createCheckboxHtml(id, key, label, href, col) {
  if (col) var _col = `col-${col}`;
  else var _col = "col-sm-6 col-md-4 col-lg-3";

  return `
  <div class="form-check ${_col} ">
    <input type="checkbox" class="form-check-input" id="${id}-${key}-check" value="${key}">
      <label class="form-check-label" for="${id}-${key}-check">
        <span class="align-middle">${label}</span>
        <a href="${href}" target="_blank">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle text-secondary" viewBox="0 0 16 16" style="vertical-align: sub;">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg></a>
        <span id="${id}-${key}-warning" class="badge rounded-pill bg-warning p-1 align-middle">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation" viewBox="0 0 16 16">
          <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.553.553 0 0 1-1.1 0L7.1 4.995z"/>
        </svg>
        <span class="visually-hidden">settings changed</span>
      </span>
    </label>
  </div>
  `;
}

/**
 * Create a div with a title and checkboxes according to a dictionary.
 * @param {String} id JupyterLab UUID
 * @param {String} key key and value of the checkbox
 * @param {Object} checkbox_config dictionary with at least {displayName: '', href: ''}
 * @param {Object} parent jquery parent element to append the checkboxes to
 */
function createCheckbox(id, key, checkbox_config, parent, new_id = "new_jupyterlab") {
  var label = checkbox_config["displayName"];
  var href = checkbox_config["href"];
  if (id == new_id) var col = 6;
  else col = null;
  parent.append(createCheckboxHtml(id, key, label, href, col));

  // Since we created the checkb ox, we also need to register the change handlers
  var checkbox = $(`#${id}-${key}-check`);
  var formCheck = $(`#${id}-${key}-check`).parents(".form-check");
  checkbox.change(function () {
    var id = get_id($(this));
    var option = $(this).val();
    var changed = checkModulesChange(id, option, this.checked);
    if (changed) {
      $(`#${id}-save-btn`).removeAttr("disabled");
      $(`#${id}-reset-btn`).removeAttr("disabled");
    }
  });
  var timer;
  var delay = 300;
  formCheck.hover(function () {
    var that = $(this);
    // on mouse in, start a timeout
    timer = setTimeout(function () {
      var checkbox = that.find("input");
      toggleWarning(checkbox, show = false);
    }, delay);
  }, function () {
    // on mouse out, cancel the timer
    clearTimeout(timer);
  });
}

/**
 * Create a div with a title and checkboxes according to a dictionary.
 * @param {String} id JupyterLab UUID
 * @param {String} title h4 title above checkboxes
 * @param {Object} checkboxes dictionary with at least {key: {displayName: '', href: ''}}
 * @param {Object} parent jquery parent element to append the checkboxes to
 */
function createCheckboxes(id, title, checkboxes, parent, new_id = "new_jupyterlab") {
  var checkbox_parent_div = $(`#${id}-${title.toLowerCase()}-div`);
  var checkbox_div = $(`#${id}-${title.toLowerCase()}-checkbox-div`);
  if ($.isEmptyObject(checkboxes)) {
    var hidden = checkbox_parent_div.css('display') == 'none' ? true : false;
    // If a section wasn't empty before, we check if any checkboxes were selected
    if (!hidden) {
      // If any checkboxes were selected, we emit a warning that those modules don't exist anymore
      var selected = false;
      checkbox_parent_div.find("input[type=checkbox").each(function () {
        if (this.checked) {
          selected = true;
          return;
        }
      })
      if (selected) toggleTabWarning($(`#${id}-modules-tab`), true);
    }
    checkbox_parent_div.hide();
    checkbox_div.empty();
  }
  else {
    checkbox_parent_div.show();
    // The div exists, so we check which checkboxes need get deleted or created
    for (const [key, config] of Object.entries(checkboxes)) {
      // Checkbox does not exists, so we have to create it
      if (!$(`#${id}-${key}-check`).length) {
        createCheckbox(id, key, config, checkbox_div, new_id);
        // Show tab warning to show that options have changed
        toggleTabWarning($(`#${id}-modules-tab`), true);
      }
    }
    // If there are any checkboxes which exist but should not, we delete them
    checkbox_div.find("input[type=checkbox]").each(function () {
      var key = $(this).val();
      if (!key in checkboxes) {
        $(this).del();
        // Show tab warning to show that options have changed
        toggleTabWarning($(`#${id}-modules-tab`), true);
      }
    })
  }
}