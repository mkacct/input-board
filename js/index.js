'use strict';

const tileColors = ['default', 'red', 'orange', 'yellow', 'lime', 'teal', 'skyblue', 'blue', 'purple'];
const defaultBoard = '{\n\t"Main": []\n}';

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
	// android back button stuff
	if (window.matchMedia('(display-mode: standalone)').matches && navigator.userAgent.toLowerCase().indexOf('android') > -1) {
		if (window.history.scrollRestoration) {window.history.scrollRestoration = 'manual';}
		
		// to do history stuff (for android back button)
		$(window).on('popstate', function(e) {
			window.history.pushState({}, '');
			if ($('.modal:visible').length > 0) {
				closeModal();
			} else {
				//openModal('#closeAppModal');
				toast('Use a different feature to leave the app', 3000);
			}
		});
		window.history.pushState({}, '');
		
		/*
		$('#closeAppButton').on('click', function(e) {
			// somehow manage to close the app
		});
		*/
	}
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
		$('#editor').val(lsGet('board', defaultBoard));
		openModal('#editModal');
	});
	// to save edits
	$('#saveButton').on('click', saveBoard);
	$('#editor').on('keydown', function(e) {
		if (e.ctrlKey && e.keyCode == 13) {saveBoard();}
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
	$('#editButton').attr('disabled', false);
	
	loadBoard();
});

function useButton(el, buttonEl) {
	if (el.type == 'menu') {
		loadView(el.viewName);
	} else if (lsGet('iftttKey', '') != '') {
		setButtonState(buttonEl, true);
		let value;
		if (el.type == 'text') { // get text value
			value = prompt(el.dialogText);
			if (value == null) { // bail
				setButtonState(buttonEl, false);
				return;
			}
		} else if (el.type == 'confirm') { // use confirmation
			if (!confirm(el.dialogText)) {
				setButtonState(buttonEl, false);
				return;
			}
		}
		requestIfttt(el.eventName, value, el.valueNumber, buttonEl);
	} else {
		if (confirm('You need to set your IFTTT Webhooks key first. Open menu now?')) {openModal('#menuModal');}
	}
}

function loadBoard() {
	$('#board').hide().empty();
	let json = lsGet('board', defaultBoard);
	if (validateBoard(json)) {
		let els = generateView(JSON.parse(json).Main);
		if (els.length > 0) {
			$('#board').append(els);
		} else {
			$('#board').html('<div class="nothingMessage">Select the <i class="fas fa-pen"></i> button to add content</div>');
		}
	} else {
		$('#board').html('<div class="nothingMessage">Your configuration is invalid. Select the <i class="fas fa-pen"></i> button to edit it.</div>');
	}
	$('#board').fadeIn(animTime);
}

function loadView(name) {
	$('#menuView').empty();
	let json = lsGet('board', defaultBoard);
	if (validateBoard(json)) {
		$('#menuViewTitle').text(name);
		let els = generateView(JSON.parse(json)[name]);
		if (els.length > 0) {
			$('#menuView').append(els);
		} else {
			$('#menuView').html('<div class="nothingMessage" style="margin-bottom: 1em;">This view is empty</div>');
		}
		openModal('#menuViewModal');
	} else {
		toast('Your configuration is invalid', 2000);
	}
}

function generateView(arr) {
	let els = [];
	let even = false;
	arr.forEach(function(el) {
		if (el == '-') {
			even = false;
			els.push($('<hr>'));
		} else {
			even = !even;
			let button = $('<button></button>');
			if (even) {button.addClass('even');}
			button.append($('<i class="fa-fw"></i>').addClass(el.icon).addClass('tileColor-' + el.color));
			button.append($('<i class="fa-fw fas fa-spinner fa-pulse"></i>'));
			button.append($('<span></span>').text(el.name));
			button.on('click', function(e) {useButton(el, this);});
			els.push(button);
		}
	});
	return els;
}

function saveBoard() {
	let json = $('#editor').val();
	if (validateBoard(json)) {
		lsSet('board', json);
		closeModal();
		loadBoard();
	} else {
		toast('<i class="fas fa-exclamation-triangle"></i>Data is not valid', 2000);
	}
}

function validateBoard(json) {
	let obj;
	try {
		obj = JSON.parse(json);
	} catch (err) {
		return false;
	}
	if (!Array.isArray(obj.Main)) {return false;}
	for (let key in obj) {
		if (!Array.isArray(obj[key])) {return false;}
		for (let i in obj[key]) {
			let temp = obj[key][i];
			if (temp != '-') {
				if (!(typeof temp.name == 'string' && temp.name.length > 0)) {return false;}
				if (!(typeof temp.icon == 'string' && temp.icon.length > 0)) {return false;}
				if (tileColors.indexOf(temp.color) < 0) {return false;}
				if (temp.type != 'menu') {
					if (!(typeof temp.eventName == 'string' && temp.eventName.length > 0)) {return false;}
				}
				if (temp.type == 'text') {
					if ([1, 2, 3].indexOf(temp.valueNumber) < 0) {return false;}
					if (!(typeof temp.dialogText == 'string' && temp.dialogText.length > 0)) {return false;}
				} else if (temp.type == 'confirm') {
					if (!(typeof temp.dialogText == 'string' && temp.dialogText.length > 0)) {return false;}
				} else if (temp.type == 'menu') {
					if (!(key == 'Main' && typeof temp.viewName == 'string' && temp.viewName.length > 0 && temp.viewName != 'Main' && obj[temp.viewName])) {return false;}
				} else if (temp.type != 'basic') {
					return false;
				}
			}
		}
	}
	return true;
}

// validate ifttt key first
function requestIfttt(eventName, value, valueNumber, buttonEl) {
	let reqData = {};
	if (value) {reqData['value' + valueNumber] = value;}
	$.ajax({
		type: 'post',
		url: 'https://maker.ifttt.com/trigger/' + eventName + '/with/key/' + lsGet('iftttKey', ''),
		data: reqData,
		timeout: 10000
	}).fail(function(xhr, status, err) {
		if (status == 'timeout') {toast('Request timed out', '2000');}
	}).always(function() {
		setButtonState(buttonEl, false);
	});
}

function setButtonState(buttonEl, state) {
	$(buttonEl).attr('disabled', state);
	if (state) {
		$(buttonEl).children('i:not(.fa-spinner)').hide();
		$(buttonEl).children('i.fa-spinner').show().css('display', 'inline-block');
	} else {
		$(buttonEl).children('i.fa-spinner').hide();
		$(buttonEl).children('i:not(.fa-spinner)').show().css('display', 'inline-block');
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