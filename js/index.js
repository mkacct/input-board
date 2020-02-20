'use strict';

// begin pwa install stuff

let installPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
	installPrompt = e;
	$('#installButton').parent().show();
});

window.addEventListener('appinstalled', function(e) {
	hideInstallOption(true);
});

function hideInstallOption(installed) {
	if (installed) {
		$('#installButton').parent().hide();
	}
	if ($('#installModal:visible').length > 0) {
		closeModal(function() {hideInstallOption2(installed);});
	} else {
		hideInstallOption2(installed);
	}
}

function hideInstallOption2(installed) { // the part that may or may not occur after closing the modal
	$('#installConfirmButton').hide();
	if (!installed) {$('#installModal p').html('Please <a href="index.html">reload the page</a> to install the web app.');}
}

// end pwa install stuff