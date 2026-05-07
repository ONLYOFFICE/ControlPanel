# Change log

## 3.5.5

* Fixed the issue with restore. When loading a backup file as a computer file, the error "An error occurred while performing the operation" occurred. (Bug 80461).

## 3.5.4

* Fixed the issue when the /controlpanel/https page crashes with the 502 error after restarting the container. (Bug 71794).
* Fixed the issue with machinekey substitution. (Bug 71456).

## 3.5.3

* Fixed the issue with missing the link to download the temporary Backup file after refreshing the page. (Bug 70341).
* Fixed the issue when a curl request to the Control Panel stops the service on Windows. (Bug 70049).
* Fixed the issue when the description of the dark theme logo indicates that the logo is for the light theme. (Bug 68858).
* Fixed the issue with the ability to switch the portal to HTTPS in the docker version (Bug 70624).
* Added a checkbox when creating a backup for migration to DocSpace.

## 3.5.2

* Added the ability to restrict access rights to the application files for the Others group (Bug 61602).
* Fixed issue with redirect to the portal main page when opening Control Panel after a day on Ubuntu 22.10 (Bug 62076).
* Fixed retrieving data error when opening the backup page (Bug 63163).
* Fixed issue when backup with Mail is not performed after disabling and enabling encryption (added text about stopping services and the instruction to the Help Center) (Bug 64223).
* Fixed issue when features are not saved to the new tariff when setting a quota for the portal (Bug 65324).
* Edited sources build.

## 3.5.0

* Changed API methods for migration, implemented progressQueue.
* Changed settings for connecting third-party storages. Added tooltips for fields. Added the 'Server Side Encryption Method' block for Amazon AWS S3.
* Added logos for dark theme in the Branding section. Logos for the About page are now separate fields in the Advanced tab.
* Added the ability to set the portal memory quota.

## 3.1.1

* Fixed issue with file indexing.
* Fixed elasticsearch container errors when updating communityserver.
* Fixed issue with brand logos after updating in the Docker installation.
* Fixed texts and layout for the Migration feature.

## 3.1.0

* Added the Data Import page that allows to import data from Nextcloud, ownCloud and GoogleWorkspace to ONLYOFFICE Workspace
* Moved Elasticsearch to a separate container
* Fixed bugs

## 3.0.0

### Update

* License agreement dialog when installing docker components added
* The inactive button with an action for uninstalled components (downloading and installing the available version) fixed

### Search

* Indexing progress display added

### LoginHistory and AuditTrail

* New empty screens added

### Restore

* New checks when restoring data from a local or a 3rd party storage

### SSO

* `SSOAuth` was removed from Control Panel. It's now available as a portal setting in Community Server

### General improvements and bug fixes

* Bugs 47721, 49101, 49187, 49273, 49272, 49324, 46386, 49585 from the internal bugtracker fixed
* 3rd party licenses and copyright updated. 
