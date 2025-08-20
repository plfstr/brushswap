// @ts-check
'use strict';

/**
* @function userMsg - Provides feedback to user
* @param {string} [msg="Sorry, your browser lacks the features required by Brush Swap"] - User message
*/
function userMsg(msg = "Sorry, your browser lacks the features required by Brush Swap") {
	alertDialog(msg);
}

//  Mustard Cut
if ( !('visibilityState' in document) ) { 
	userMsg();
}

// Storage must be present for StoreJS to function...
var hasLocalstorage = () => {
	try {
		localStorage.setItem('retoothbrush', 'rtb');
		localStorage.removeItem('retoothbrush');
		return true;
	} catch(e) {
   	    userMsg('Local storage is not supported by your browser. Please disable ‘Private Mode’, or upgrade browser');
	    return false;
	}
}

// Is HTTPS?
if ( window.isSecureContext === false ) {
	userMsg('Local storage is disabled by your browser in non-secure(HTTP) contexts. Check page URL is secure with ‘HTTPS’ (padlock symbol).');
}


/** 
 * @var storedDate - checks typeof to keep Chrome happy, gets stored date
 * @type {string | null}
 */
var storedDate = null;
if (hasLocalstorage) {
	storedDate = localStorage.getItem('dateSwapped');
}

// Check storage persisted and prompt if not
if (window.matchMedia('(display-mode: browser)').matches) {
	if (storedDate && navigator?.storage?.persist) {
		navigator.storage.persisted().then((persistence) => {
			if (persistence !== true) {
				userMsg('Brush Swap date will be lost without ‘Persistant Storage’ permission. \n Allow this browser permission, or install app to homescreen.');
			}
		})
	}
}


/**
*	@function dateValid - Checks date value passed is valid date
*	@param {date} dateChecked
*	@return {boolean}
*/
function dateValid(testdate) {
	try {
		let testarray = testdate.split('-');
		return Temporal.PlainDate.from(testdate).equals({year: testarray?.[0], month: testarray?.[1], day: testarray?.[2]});
	}
	} catch(err) {
		return false;
	}
}


/**
* @function dayPlural - Days Remaining Plural String Function
* @param {number} daysremain
* @return {string} - XX day(s)
*/
function dayPlural(daysremain) {
	return daysremain === 1 ? `${daysremain} day` : `${Math.max(0, daysremain)} days`;
}


/**
*	@function dateUtc - Make UTC Version to add as datetime attribute
*	@param {date} dateIn
*	@return {date}
*/
function dateUtc( dateIn ){
	
	if ( dateIn ) {
		return Temporal.PlainDateTime.from(dateIn).toString();
	}
	
}


/**
* @class makeDates
*/
class makeDates {

	#date;

	/** @param {date} datechanged */
	constructor (datechanged) {
		/** @private */
		this.#date = Temporal.PlainDate.from(datechanged);
	}

	/** @returns {date} */
	get dateStart() {
		return this.#date;
	}

	/** @returns {date} */
	get dateEnd() {
		return this.#date.add({ days: 90});
	}
	
	/** @returns {Object} */
	get dateDayremain() {
		return Temporal.Now.plainDateISO().until(this.dateEnd);
	}
	
}

/**
* @function dateFill - Add dates to DOM
* @param {date} datechanged
*/
function dateFill(datechanged) {

	if ( dateValid(datechanged) ) {
		
		/** @type {Object} */
		const {dateStart, dateDayremain, dateEnd} = new makeDates(datechanged);
		
		// Vars
		let domDaystart = document.querySelector('#dayStart');
		let domDayremain = document.querySelector('#dayRemaining');
		let domDayend = document.querySelector('#dayEnd');		
		
		// Date Start		
		domDaystart.textContent = dateStart.toLocaleString();
		domDaystart.setAttribute('datetime', `${dateUtc(dateStart)}`);

		// Days Remain
		domDayremain.textContent = `${ dayPlural(dateDayremain.days) }`;
		domDayremain.setAttribute('datetime', dateDayremain);
		
		// Date End
		domDayend.textContent = dateEnd.toLocaleString();
		domDayend.setAttribute('datetime', `${dateUtc(dateEnd)}`);
	
	}
		
}


/**
* @function brushDate - Get stored date
* @callback {dateFill}
*/
function brushDate() {
	
	if ( storedDate ) {
		dateFill(storedDate);
	} else {
		return;
	}

}


/* 
* @function confirmDialog - Dialog/confirm brush change 
* @callback brushSwapped
*/
const domdialog = document.querySelector('#rtbconfirm');
const hasdialog = typeof domdialog.showModal === 'function';
function confirmDialog() {

	if (hasdialog) {
		domdialog.showModal();
		domdialog.addEventListener("close", () => {
			if (domdialog.returnValue === 'true') {
				brushSwapped();
			}
		});
	} else {
		!confirm('Brush Changed. Create new date?');
		brushSwapped();
	}

}

/*
* @function alertDialog - Alert dialog
*/
const domalert = document.querySelector('#rtbalert');
function alertDialog(msg) {

	if (hasdialog) {
		domalert.querySelector(':scope p').textContent = msg;
		domalert.showModal();
	} else {
		!confirm(msg);
		return;
	}

}

/*
* @function brushSwapped - Store new date, refresh UI
*/
function brushSwapped() {
	try {
		let datenow = Temporal.Now.plainDateISO().toString();
		localStorage.setItem('dateSwapped', datenow);
		dateFill(datenow);
		document.body.classList.add('has-updated');
		if (navigator?.storage?.persist) {
			navigator.storage.persist().then((persistence) => {
				if (!persistence) {
					userMsg('Brush Swap date will be lost without ‘Persistant Storage’ persmission. \n Allow this browser permission, or install app to homescreen.');
				}
			})
		}
		if (navigator.clearAppBadge) {
			navigator.clearAppBadge().catch((error) => {
				console.error(error);
			});
		}
		if (deferredPrompt) {
			deferredPrompt.prompt();
		}
	} catch(err) {
		if (err instanceof ReferenceError) { 
			userMsg('Data Save Failed! Check browser cookie and storage settings and retry');
		} else {
			userMsg('Data Save Failed! Check browser settings and retry');
		}
	}	
}


/**
* @function brushSwap - Check stored date, conditionally ask for confirmation
* @callback confirmDialog
* @callback brushSwapped
*/
function brushSwap() {
	if (storedDate) {
		confirmDialog();
	} else {
		brushSwapped();
	}
}


/*
* DOMContentLoaded
*/
document.addEventListener('DOMContentLoaded', brushDate, {once: true});

/*
* Button Listener
*/
document.querySelector('#brushchange').addEventListener('click', brushSwap, false);

if ("serviceWorker" in navigator) {
	if (navigator.serviceWorker.controller) {
	  console.log("Service Worker Registered");
	} else {
	  navigator.serviceWorker
		.register("sw.js", {
		  scope: "./"
		})
		.then(function (reg) {
		  console.log('Service Worker Registered!');
		})
		.catch(function(error) {
		  console.log('Registration failed with ' + error);
		});
	}
}

/**
 * Stored date expired icon badging...
 */
if (storedDate && navigator.setAppBadge) {
	if (new makeDates(storedDate).dateDayremain.days <= 10) {
	    navigator.setAppBadge().catch((error) => {
	      console.error(error);
	    });
	}
}

/**
* Delay PWA install prompt. Call after brush swap...
*/
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
