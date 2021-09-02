// @ts-check
'use strict';

/**
* @function userMsg - Provides feedback to user
* @param {string} [msg] - User message
*/
function userMsg(msg = "Sorry, your browser lacks the features required by reToothbrush") {
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
if ( typeof store !== 'undefined' && !store.enabled ) {
	userMsg('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade browser');
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
if (typeof store !== 'undefined') {
	storedDate = store.get('dateSwapped');
}


/**
*	@function dateChecked - Checks date value passed is valid date
*	@param {date} dateChecked
*	@return {boolean}
*/
function dateValid( dateChecked ) {
	return moment( dateChecked, "YYYY-MM-DD", true ).isValid();
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
		return moment(dateIn).utc().format();
	}
	
}


/**
* @class makeDates
*/
class makeDates {

	/** @param {date} datechanged */
	constructor (datechanged) {
		/** @type {date} */
		this.date = moment(datechanged, "YYYY-MM-DD");
	}

	/** @returns {date} */
	_dateStart() {
		return this.date;
	}

	/** @returns {date} */
	_dateEnd() {
		return moment(this.date).add(90, 'days');
	}
	
	/** @returns {number} */
	_dateDayremain() {
		return Math.max(0, this._dateEnd().diff(moment(), 'days') );
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
		domDaystart.textContent = datestart.format('DD/MM/YYYY');
		domDaystart.setAttribute('datetime', `${dateUtc(datestart)}`);

		// Days Remain
		domDayremain.textContent = `${ dayPlural(dateremain) }`;
		domDayremain.setAttribute('datetime', `P ${dateremain} D`);
		
		// Date End
		domDayend.textContent = dateend.format('DD/MM/YYYY');
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

	
/**
* @function brushSwap - Save to LocalStorage
* @callback dateFill
*/
function brushSwap() {

	console.warn('Brushchange!');
	/** @type {date} */	let datenow = moment().format("YYYY-MM-DD");
	
	if ( dateValid( datenow ) ) {
		if (storedDate) {
			confirm('Brush Changed. Create new date?');
		}
		dateFill(datenow);
		store.set('dateSwapped', datenow);
	}
	
	if (hasScheduling) {
		try {
			createScheduledNotification('retoothbrush', 'ReToothbrush', moment().valueOf());
			document.querySelector('i').textContent = moment().add(1, 'days').valueOf();
		} catch(error) {
			console.warn(error);
			confirm('Notification failed to schedule. You will not receive a reminder');
		}
	}

	// Trigger fade-in effect
	document.body.classList.add('has-updated');
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

/*
* Scheduled Notifications Test
*/
const hasScheduling = "showTrigger" in Notification.prototype;
var createScheduledNotification;
var cancelScheduledNotification;

if (hasScheduling) {

	navigator.permissions.query({name:'notifications'}).then(function(result) {
		if (result.state == 'granted') {
			confirm('You will receive notification reminders');
		} else {
			confirm('You need to enable notifications to receive notification reminders');
			Notification.requestPermission().then(function(result) {
				console.log(result);
			});
		}
	});

	createScheduledNotification = async (tag, title, timestamp) => {
		console.log({tag, title, timestamp});
		let timedelay = 1000 * 60 * 60 * 24 * 90;
		const registration = await navigator.serviceWorker.getRegistration();
		console.log(registration);
		registration.showNotification(title, {
			tag: tag,
			body: "Its time to swap your toothbrush!",
			showTrigger: new TimestampTrigger(timestamp + timedelay)
		});
	};

	cancelScheduledNotification = async (tag) => {
		const registration = await navigator.serviceWorker.getRegistration();
		const notifications = await registration.getNotifications({
		  tag: tag,
		  includeTriggered: true,
		});
		notifications.forEach((notification) => notification.close());
	};
}