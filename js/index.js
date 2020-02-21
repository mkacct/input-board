'use strict';

const tileColors = {
	'red': 'red',
	'orange': 'orange',
	'yellow': 'yellow',
	'green': 'green',
	'blue': 'blue',
	'purple': 'purple',
}

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
	// to open the edit modal
	$('#editButton').on('click', function(e) {
		$('#editor').val(lsGet('board', '[]'));
		openModal('#editModal');
	});
	// to save edits
	$('#saveButton').on('click', saveBoard);
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
	$('#editButton').attr('disabled', false);
	
	loadBoard();
});

function loadBoard() {
	$('#board').hide().empty();
	let json = lsGet('board', '[]');
	if (validateBoard(json)) {
		let arr = JSON.parse(json);
		if (arr.length > 0) {
			let els = [];
			arr.forEach(function(el) {
				let button = $('<button></button>');
				button.append($('<i class="fa-fw"></i>').addClass(el.icon).css('color', tileColors[el.color]));
				button.append($('<span></span>').text(el.name));
				button.on('click', function(e) {
					if (lsGet('iftttKey', '') != '') {
						setButtonState(this, 'busy');
						let value;
						if (typeof el.type == 'string') {
							if (el.type == 'text') {
								value = prompt('Enter text');
								if (value == null) { // bail
									setButtonState(this, 'default');
									return;
								}
							}
						}
						requestIfttt(el.eventName, value, el.valueNumber, this);
					} else {
						if (confirm('You need to set your IFTTT Webhooks key first. Open menu now?')) {openModal('#menuModal');}
					}
				});
				els.push(button);
			});
			$('#board').append(els);
		} else {
			$('#board').html('<div class="suit" style="color: gray; text-align: center;">No content yet</div>');
		}
		$('#board').fadeIn(animTime);
	} else {
		throw 'you let them save invalid data?!';
	}
}

function saveBoard() {
	let json = $('#editor').val();
	if (validateBoard(json)) {
		lsSet('board', json);
		closeModal();
		loadBoard();
	} else {
		toast('JSON contains error', 2000);
	}
}

function validateBoard(json) {
	let obj;
	try {
		obj = JSON.parse(json);
	} catch (err) {
		return false;
	}
	if (!Array.isArray(obj)) {return false;}
	for (let i in obj) {
		if (!(typeof obj[i].name == 'string' && obj[i].name.length > 0)) {return false;}
		if (!(typeof obj[i].icon == 'string' && obj[i].icon.length > 0)) {return false;}
		if (!(typeof obj[i].color == 'string' && typeof tileColors[obj[i].color] == 'string')) {return false;}
		if (!(typeof obj[i].eventName == 'string' && obj[i].eventName.length > 0)) {return false;}
		if (typeof obj[i].type == 'string') {
			if (obj[i].type == 'text') {
				if ([1, 2, 3].indexOf(obj[i].valueNumber) < 0) {return false;}
			} else {
				return false;
			}
		}
	}
	return true;
}

// validate ifttt key first
function requestIfttt(eventName, value, valueNumber, buttonEl) {
	let reqData = {value1: '', value2: '', value3: ''};
	if (value) {reqData['value' + valueNumber] = value;}
	$.ajax({
		type: 'post',
		url: 'https://maker.ifttt.com/trigger/' + eventName + '/with/key/' + lsGet('iftttKey', ''),
		data: reqData
	}).always(function() {
		setButtonState(buttonEl, 'completed');
	});
}

function setButtonState(buttonEl, state) {
	if (state == 'completed') {
		$(buttonEl).attr('disabled', true);
		setTimeout(function() {setButtonState(buttonEl, 'default');}, 1500)
	} else if (state == 'busy') {
		$(buttonEl).attr('disabled', true);
	} else {
		$(buttonEl).attr('disabled', false);
	}
}

function showIftttKey() {
	let key = lsGet('iftttKey', '');
	if (key == '') {
		$('#iftttKey').html('<i>Not set</i>');
	} else {
		$('#iftttKey').text(lsGet('iftttKey', ''));
	}
}