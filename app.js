// @ts-check
'use strict';

/**
* @function userMsg - Provides feedback to user
* @param {string} [msg="Sorry, your browser lacks the features required by Brush Swap"] - User message
*/
function userMsg(msg = "Sorry, your browser lacks the features required by Brush Swap") {
	alertDialog(msg);
	console.error(msg);
	document.querySelector('#brushchange').setAttribute('disabled', 'disabled');
	return;
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
   	    userMsg('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade browser');
	    return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
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


/**
 * @var ispersisted
 * @type {boolean}
 */
let ispersisted = false;
if (navigator.storage && navigator.storage.persist) {
	navigator.storage.persisted().then((persistence) => {
		ispersisted = persistence;
	})
}


/**
 * @var noprompt
 * @type {boolean}
 */
const noprompt = window.matchMedia('(display-mode: standalone)').matches || ispersisted;


/**
*	@function dateChecked - Checks date value passed is valid date
*	@param {date} dateChecked
*	@return {boolean}
*/
function dateValid( dateChecked ) {
	return dayjs(dateChecked).isValid();
}


/**
* @function - Days Remaining Plural String Function. New Intl.relativeTime API method!!! Use Polyfill (one exist yet??)
* @param {number} daysRemaining
* @return {string} - XX day(s)
*/
function dayPlural(daysRemaining) {
	
	if ( Number.isInteger(daysRemaining) ) {
	
		if (daysRemaining !== 1) {
			return daysRemaining + ' ' + 'days';
		} else {
			return daysRemaining + ' ' + 'day';
		}

	}
}


/**
*	@function dateUtc - Make UTC Version to add as datetime attribute
*	@param {date} dateIn
*	@return {date}
*/
function dateUtc( dateIn ){
	
	if ( dateValid(dateIn) ) {
		return dayjs(dateIn).format();
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
		this.#date = dayjs(datechanged);
	}

	/** @returns {date} */
	get dateStart() {
		return dayjs(this.#date).format();
	}

	/** @returns {date} */
	get dateEnd() {
		return dayjs(this.#date).add(90, 'day').format();
	}
	
	/** @returns {number} */
	get dateDayremain() {
		return Math.abs( Math.min(0, dayjs(new Date()).diff(this.dateEnd(), 'day') ) );
	}
	
}

/**
* Add dates to DOM
* @function dateFill
* @param {date} datechanged
*/
function dateFill(datechanged) {

	if ( dateValid(datechanged) ) {
		
		/** @type {Object} */
		const makedate = new makeDates(datechanged);
		
		// Vars
		let domDaystart = document.querySelector('#dayStart');
		let	domDayremain = document.querySelector('#dayRemaining');
		let	domDayend = document.querySelector('#dayEnd');		
		
		// Date Start		
		domDaystart.textContent = dayjs(makedate.dateStart).format('DD/MM/YYYY');
		domDaystart.setAttribute('datetime', `${dateUtc(makedate.dateStart)}`);

		// Days Remain
		domDayremain.textContent = `${ dayPlural(makedate.dateDayremain) }`;
		domDayremain.setAttribute('datetime', `P${makedate.dateDayremain}D`);
		
		// Date End
		domDayend.textContent = dayjs(makedate.dateEnd).format('DD/MM/YYYY');
		domDayend.setAttribute('datetime', `${dateUtc(makedate.dateEnd)}`);
	
	}
		
}


/**
* Get stored date
* @function brushDate
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
		let datenow = dayjs().format();
		localStorage.setItem('dateSwapped', datenow);
		dateFill(datenow);
		document.body.classList.add('has-updated');
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
* If stored data and not persisted, display install prompt!
*/
if (storedDate && !noprompt) {
	if ( !document.querySelector('#installprompt' )) {
		const banner = document.createElement('p');
		banner.id = "installprompt";
		banner.textContent = "Install app to homescreen to ensure data saved";
		document.querySelector('#brushchange').after(banner);
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
if (navigator.setAppBadge && storedDate && dayjs(storedDate).add(90, 'day') < dayjs() ) {
    navigator.setAppBadge().catch((error) => {
      console.error(error);
    });
}

/**
* Delay PWA install prompt. Call after brush swap...
*/
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});
