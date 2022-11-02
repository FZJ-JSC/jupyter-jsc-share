/**
 * Sets values for JupyterLab configuration input elements,
 * including selects, inputs and checkboxes.
 * Cannot be used for new JupyterLabs, since all values would be null.
 * @param  {String} id JupyterLab UUID
 * @param  {Array} options JupyterLab config options, e.g. from user_options[id]
 */
function setValues(id, options) {
  if (options["service"]) var service = options["service"].split('/')[1];
  var system = options["system"];
  var account = options["account"];
  var project = options["project"];
  var partition = options["partition"];
  var reservation = options["reservation"];
  var nodes = options["nodes"];
  var runtime = options["runtime"];
  var gpus = options["gpus"];
  var modules = options["additional_spawn_options"];

  // The following functions add values to input elements where applicable,
  // e.g. adds options to select input elements (dropdowns),
  // and set inital values according to the options passed.
  updateService(id, service);
  updateSystems(id, service, system);
  updateAccounts(id, service, system, account);
  updateProjects(id, service, system, account, project);
  updatePartitions(id, service, system, account, project, partition);
  updateResources(id, service, system, account, project, partition, nodes, runtime, gpus);
  updateReservation(id, service, system, account, project, partition, reservation);
  updateModules(id, service, system, account, project, partition, modules);
}

/**
 * Sets fixed values for JupyterLab configuration input elements,
 * including selects, inputs and checkboxes.
 * 
 * @param  {String} id JupyterLab UUID
 * @param  {Array} options JupyterLab config options, e.g. from user_options[id]
 */
function setFixedValues(id, options) {
  var service = options["service"].split('/')[1];
  var system = options["system"];
  var account = options["account"];
  var project = options["project"];
  var partition = options["partition"];
  var modules = options["additional_spawn_options"];

  // select dropdowns
  ["version", "system", "account", "project", "partition", "reservation"]
    .forEach(function (key) {
      if (key == "version") value = options["service"].split('/')[1];
      else value = options[key];
      var select = $(`select#${id}-${key}-select`);
      select.append(`<option value="${value}">${value}</option>`).addClass("disabled");
    });
  // Need to manually hide the reservation div and tab
  // since the updateReservation function isn't called.
  if (!options["reservation"]) {
    $(`#${id}-reservation-select-div`).hide();
    toggleTab(id, "reservation", true);
  }

  // number inputs
  ["name", "nodes", "runtime", "gpus"].forEach(function (key) {
    var input = $(`input#${id}-${key}-input`);
    input.val(options[key]).attr("disabled", true);
    // Need to manually hide some input divs since the updateResources function isn't called.
    if (key != "name" && !options[key]) $(`#${id}-${key}-input-div`).hide();
  });
  // Need to manually hide the resource tab since the updateResources function isn't called.
  if (!options["nodes"] && !options["runtime"] && !options["gpus"]) {
    toggleTab(id, "resources", true);
  }

  // checkboxes
  // Modules do not depend on the vo, so no issue with using the update function.
  updateModules(id, service, system, account, project, partition, modules);
  // Still need to disable the checkboxes however
  $(`input[type=checkbox][id*=${id}]`).each(function () {
    $(this).attr("disabled", true);
  });
}

/**
 * Sets values for all JupyterLab inputs.
 * @param  {String} id JupyterLab UUID
 * @param  {Array} user_options array containing the user options for each spawner, 
 *                              e.g. {'spawner_id': spawner.user_options}
 */
function setInitialValues(user_options) {
  for (const [id, options] of Object.entries(user_options)) {
    var na = $(`tr[data-server-id=${id}]`).find("span.na-status").html();
    /* Only disable a Lab if it is not allowed due to the VO that is active, 
     * since then the values for the selects won't be filled correctly by 
     * the updateX (X=options, systems, accounts...) functions.
     * If the system is only in maintenance, the selects will still
     * be filled correctly, so we don't need to disable the user input elements.           
    */
    if (na == "1") {
      setFixedValues(id, options);
    } else {   // na == "0" or na == "2" (maintenance)
      setValues(id, options);
    }
    // Remove any warning styling when manually setting values.
    $(`#${id}-configuration input, #${id}-configuration select`).each(function () {
      toggleWarning($(this), false);
    });
  }
}

/**
 * Sets initial values for new JupyterLabs. Assumes that user input
 * change handlers have already been registered.
 * @param {String} id id for new jupyterlabs.
 */
function setNewJupyterLabValues(id, service) {
  // Reset all dropdowns and inputs
  // Exclude checkboxes since their checked status does not depend on their value
  $(`#${id}-dialog`).find("select, input").not("[type=checkbox]").each(function () {
    $(this).val(null);
  })
  $(`#${id}-name-input`).val(""); // Reset name
  $(`#${id}-name-input`).addClass("border-warning");
  $(`#${id}-name-warning`).show();

  /* Since we don't have user_options for new JupyterLabs,
    * we don't want to call the updateX (X = system, account, projects, ...)
    * functions since all parameters that need to be passed would be null.
    * Instead, we manually trigger the first update which will automatically
    * update all other config input element due to the `change` handlers.
  */
  updateService(id);

  // Explicitely show all warnings for checkboxes since they don't work with null values
  $(`input[type=checkbox][id*=${id}]`).each(function () {
    toggleWarning($(this), true, false);
  })

  // Always show the first tab
  var trigger = $(`#${id}-service-tab`);
  var tab = new bootstrap.Tab(trigger);
  tab.show();

  // Disable start if there are no systems available;
  var systemSelect = $(`${id}-system-select`);
  if (systemSelect.children().first().prop("disabled")) {
    $(`${id}-start-btn`).addClass("disabled");
    // Also disable all tabs
    $(`[id^=${id}][id$=-tab]`).addClass("disabled")
  }
}

/**
 * Updates available systems depending on the JupyterLab Version.
 * To be used with a change handler for the version form element.
 */
function versionChanged() {
  var id = get_id($(this));
  var service = $(this).val();
  updateSystems(id, service);
};

/**
 * Update available accounts depending on the system.
 * To be used with a change handler for the system form element.
 */
function systemChanged() {
  var id = get_id($(this));
  var service = $(`select#${id}-version-select`).val();
  var system = $(this).val();
  updateAccounts(id, service, system);
};

/**
 * Update available projects depending on the account.
 * To be used with a change handler for the account form element.
 */
function accountChanged() {
  var id = get_id($(this));
  var service = $(`select#${id}-version-select`).val();
  var system = $(`select#${id}-system-select`).val();
  var account = $(this).val();
  updateProjects(id, service, system, account);
};

/**
 * Update available partitions depending on the project.
 * To be used with a change handler for the project form element.
 */
function projectChanged() {
  var id = get_id($(this));
  var service = $(`select#${id}-version-select`).val();
  var system = $(`select#${id}-system-select`).val();
  var account = $(`select#${id}-account-select`).val();
  var project = $(this).val();
  updatePartitions(id, service, system, account, project);
};

/**
 * Update available resources and reservations depending on the partition.
 * To be used with a change handler for the partition form element.
 */
function partitionChanged() {
  var id = get_id($(this));
  var service = $(`select#${id}-version-select`).val();
  var system = $(`select#${id}-system-select`).val();
  var account = $(`select#${id}-account-select`).val();
  var project = $(`select#${id}-project-select`).val();
  var partition = $(this).val();
  updateResources(id, service, system, account, project, partition);
  updateReservation(id, service, system, account, project, partition);
  // Currently, modules only depend on the service chosen, but
  // should really depend on the partition too.
  updateModules(id, service, system, account, project, partition);
};

/**
 * Checks if the selected value of an input element 
 * for a JupyterLab corresponds to the previous values 
 * saved in the `user_options` dict.
 * @param {String} id JupyterLab UUID
 * @param {String} option which user option of the `user_options` to compare
 * @param {String} currentVal currently selected value of the corresponding input element
 * @returns {Bool} true if the value has changed
 */
function checkUserOptionsChange(id, option, currentVal) {
  var options = user_options[id];
  if (options) {
    switch (option) {
      case "type":
        var previousValue = options["options_input"];
        break;
      case "nodes":
        var previousValue = options["resource_Nodes"];
        break;
      case "runtime":
        var previousValue = options["resource_Runtime"];
        break;
      case "gpus":
        var previousValue = options["resource_GPUS"];
        break;
      default:
        var previousValue = options[option + "_input"];
    }

    if (currentVal != previousValue) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a module checkbox has been selected/deselected
 * compared to the JupyterLab values saved in the `user_options` dict.
 * @param {String} id JupyterLab UUID
 * @param {String} option which module to compare
 * @param {String} currentVal currently selected value of the corresponding input element
 * @returns {Bool} true if the value has changed
 */
function checkModulesChange(id, option, currentVal) {
  var options = user_options[id];
  if (options) {
    var previousValues = options["additional_spawn_options"];
    // Changed if value got selected but not in old values
    // or if unselected but present in old values
    if ((currentVal && !previousValues.includes(option) || (!currentVal && previousValues.includes(option)))) {
      return true;
    }
  }
  return false;
}