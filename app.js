// @ts-check
'use strict';

/**
* @function userMsg - Provides feedback to user
* @param {string} [msg="Sorry, your browser lacks the features required by Brush Swap"] - User message
*/
function userMsg(msg = "Sorry, your browser lacks the features required by Brush Swap") {
	alert(msg);
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
 * @type {string}
 */
var storedDate = null;
if (hasLocalstorage) {
	storedDate = localStorage.getItem('dateSwapped');
}

/**
 * @var isstandalone
 * @type {boolean}
 */
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
if (storedDate && !isStandalone) {
	const banner = document.createElement('p');
	banner.textContent = "Install app to homescreen to ensure data saved";
	document.querySelector('#brushchange').after(banner);
}


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

	/** @param {date} datechanged */
	constructor (datechanged) {
		/** @type {date} */
		this.date = dayjs(datechanged);
	}

	/** @returns {date} */
	_dateStart() {
		return dayjs(this.date).format();
	}

	/** @returns {date} */
	_dateEnd() {
		return dayjs(this.date).add(90, 'day').format();
	}
	
	/** @returns {number} */
	_dateDayremain() {
		return Math.abs( Math.min(0, dayjs(new Date()).diff(this._dateEnd(), 'day') ) );
	}

	/** @returns {object} */
	get brushDates() {
		return {datestart: this._dateStart(), dateremain: this._dateDayremain(), dateend: this._dateEnd()}
	}
	
}

/**
* Add dates to DOM
* @function dateFill
* @param {date} datechanged
*/
function dateFill(datechanged) {

	if ( dateValid(datechanged) ) {
		
		/** @type {object} */
		let {datestart, dateremain, dateend} = new makeDates(datechanged).brushDates;
		
		// Vars
		let domDaystart = document.querySelector('#dayStart');
		let	domDayremain = document.querySelector('#dayRemaining');
		let	domDayend = document.querySelector('#dayEnd');		
		
		// Date Start		
		domDaystart.textContent = dayjs(datestart).format('DD/MM/YYYY');
		domDaystart.setAttribute('datetime', `${dateUtc(datestart)}`);

		// Days Remain
		domDayremain.textContent = `${ dayPlural(dateremain) }`;
		domDayremain.setAttribute('datetime', `P${dateremain}D`);
		
		// Date End
		domDayend.textContent = dayjs(dateend).format('DD/MM/YYYY');
		domDayend.setAttribute('datetime', `${dateUtc(dateend)}`);
	
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
const domdialog = document.querySelector('dialog');
const hasdialog = typeof domdialog.showModal === 'function';
function confirmDialog() {

	if (hasdialog) {
		domdialog.showModal();
		document.querySelector('#rtbdialogyes').addEventListener('click', function () {
			domdialog.close();
			brushSwapped();
		}, {once: true})
	} else {
		!confirm('Brush Changed. Create new date?');
		brushSwapped();
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


// Once Event Listener Test / Polyfill
/** 
 * @var supportsOnce
 * @type {boolean} 
 */
var supportsOnce = false;
try {
	let opts = Object.defineProperty({}, 'once', {
		get: function() {
			supportsOnce = true;
		}
	});
	window.addEventListener("test", null, opts);
} catch (e) {} 

/*
* DOMContentLoaded
*/
document.addEventListener('DOMContentLoaded', brushDate, supportsOnce? { once: true } : false);

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
