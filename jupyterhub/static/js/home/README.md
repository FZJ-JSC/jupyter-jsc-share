### handleServers.js
Any functions that start, stop, delete a spawner or modify the spawn options via save or reset are in this file. Also registers those functions to the corresponding buttons.

### updateConfigElements.js
Contains functions that update any input elements such as selects, number inputs or checkboxes. Since updates to those elements might mean warning icons should appear to indicate a change, any functions handling the warning icon logic are also in this file.

### updateConfig.js
Includes a variety of function pertaining to JupyterLab configs.

Contains functions that set JupyterLab config values, either based on existing user options or for new JupyterLabs. Also contains the change handlers which need to be registered to the user input elements, so that choices dynamically update depending on the selections a user has made. Finally, contains functions which can check if updated user choices corresponds to those saved in a spawner's user options attribute.

### updateTableElements.js
Some convenience function for finding, toggling, en-/disabling a table row or certain tabs in the collapisble table row are in this file.

### updateSpawnElements.js
Contains functions which update the UI when a spawner is starting or stopping. Includes functions to style the progress bar, update logs and handler functions for listening to start and stop events via evtSource objects.