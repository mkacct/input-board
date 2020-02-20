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

$(document).ready(function() {
	// add events
	// TODO: android back button
	// to scroll to top by clicking the logo
	$('#logoLink').on('click', function(e) {
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			$('html, body').animate({scrollTop: 0}, uiAnimTime);
		} else {
			$('html, body').scrollTop(0);
		}
	});
	// to open the install modal
	$('#installButton').on('click', function(e) {
		openModal('#installModal');
	});
	// to show the install prompt (pwa)
	$('#installConfirmButton').on('click', function(e) {
		installPrompt.prompt();
		hideInstallOption(false);
		installPrompt.userChoice.then(function(choice) {
			if (choice.outcome == 'accepted') {hideInstallOption(true);}
			installPrompt = null;
		});
	});
	// to open the menu modal
	$('#menuButton').on('click', function(e) {
		showIftttKey();
		openModal('#menuModal');
	});
	// to change the ifttt key
	$('#setIftttKeyButton').on('click', function(e) {
		let newKey = prompt('Paste your IFTTT Webhooks key');
		if (newKey != null) {
			lsSet('iftttKey', newKey);
			showIftttKey();
		}
	});
	
	$('#menuButton').attr('disabled', false);
	$('#viewsButton').attr('disabled', false);
});

function showIftttKey() {
	let key = lsGet('iftttKey', '');
	if (key == '') {
		$('#iftttKey').html('<i>Not set</i>');
	} else {
		$('#iftttKey').text(lsGet('iftttKey', ''));
	}
}