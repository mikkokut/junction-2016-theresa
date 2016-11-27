const restify = require('restify');
const builder = require('botbuilder');
const Watson = require( 'watson-developer-cloud/conversation/v1' );
const request = require('request');
const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid');

const plotly = require('plotly')(process.env.PLOTLY_USERNAME, process.env.PLOTLY_PASS);

const WORKSPACE_ID = process.env.WORKSPACE_ID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BEARER = `Bearer ${AUTH_TOKEN}`;


const conversation = new Watson({
	username: process.env.WATSON_USERNAME,
	password: process.env.WATSON_PASSWORD,
	url: 'https://gateway.watsonplatform.net/conversation/api',
	version_date: '2016-09-20',
	version: 'v1'
});

const server = restify.createServer();
server.listen(process.env.PORT || 5000, function () {
	console.log('%s listening to %s', server.name, server.url); 
});

server.get('/', (req, res, next) => {
	res.send(200, `App id: ${process.env.MICROSOFT_APP_ID} Password: ${process.env.MICROSOFT_APP_PASSWORD}`);
	return next();
});
  
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


const addresses = [];


server.get('ask', (req, res, next) => {

	_.forEach(addresses, address => {
		bot.beginDialog(address, '/morningFeeling');
	});

	res.send(200, `Started conversation with ${addresses.length} clients`);
   	return next();

});

bot.dialog('/', function (session) {
	session.sendTyping();

	saveAddress(session.message.address);
	console.log(`User joined! There is ${addresses.length} clients right now`);

	console.log(session.message.text);

	if (session.message.text.indexOf('/start') !== -1) {
		session.send('I am Theresa, your personal sleep assistant. I work with your ŌURA Ring but for demonstration purposes I currently fetch the data from demo account. Ask me about your sleep.');
		return;
	}

	var payload = {
    	workspace_id: WORKSPACE_ID,
    	context: {
    		conversation_id: session.message.address.conversation.id
    	},
    	input: {
    		text: session.message.text
    	}
  	};

  	conversation.message(payload, function(err, data) {
  		if (err) {
  			console.log('Error: ' + JSON.stringify(err));
  		}
  		else {
  			_.forEach(data.intents, intent => {
  				handleIntent(intent, data, session);
  			});
  		}
  	});

});

bot.dialog('/morningFeeling', [
	session => {
		var date = moment().subtract({days: 1}).format('YYYY-MM-DD');
		request.get({
			url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
			headers: {Authorization: BEARER},
		}, (err, r, body) => {

			if (err) {}
			else {
				const data = JSON.parse(body);
				const sleep = data.sleep.length > 0 ? data.sleep[0] : null;
				if (sleep) {

					var duration = sleep.duration;
					var hours = Math.floor(duration / 3600);
					var minutes = Math.floor((duration - hours * 3600) / 60);

					session.send();
					builder.Prompts.choice(session, `Good morning. You slept ${hours} hours and ${minutes} minutes last night. How are you feeling today?`, 'Excellent!|Good.|Not so great.|Awful!');
				}
			}
		});
	},

	(session, results) => {
		session.sendTyping();

		var date = moment().subtract({days: 1}).format('YYYY-MM-DD');
		request.get({
			url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
			headers: {Authorization: BEARER},
		}, (err, r, body) => {

			if (err) {}
			else {
				const data = JSON.parse(body);
				const sleep = _.first(data.sleep);
				if (sleep) {
					switch (session.message.text) {
						case 'Excellent!':

							var keys = [
								'score_total',
								'score_deep',
								'score_rem',
								'score_efficiency',
								'score_latency',
								'score_disturbances',
								'score_alignment',
							];


							var bestKey = keys[0];
							var bestValue = sleep[bestKey];
							_.forEach(keys, key => {
								if (sleep[key] > bestValue) {
									bestValue = sleep[key];
									bestKey = key;
								}
							});


							switch (bestKey) {
								case 'score_total':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you sleep long! You can ask me more about your sleep :)`);
									break;
								case 'score_deep':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you had a lot of deep sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_rem':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you had a lot of rem sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_efficiency':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you slept efficiently. You can ask me more about your sleep :)`);
									break;
								case 'score_latency':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that fell asleep very soon. You can ask me more about your sleep :)`);
									break;
								case 'score_disturbances':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that had low disturbances. You can ask me more about your sleep :)`);
									
									break;
								case 'score_alignment':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you went to bed correct time. You can ask me more about your sleep :)`);

									break;
							}

							break;


						case 'Good.':

							var keys = [
								'score_total',
								'score_deep',
								'score_rem',
								'score_efficiency',
								'score_latency',
								'score_disturbances',
								'score_alignment',
							];


							var bestKey = keys[0];
							var bestValue = sleep[bestKey];
							_.forEach(keys, key => {
								if (sleep[key] > bestValue) {
									bestValue = sleep[key];
									bestKey = key;
								}
							});


							switch (bestKey) {
								case 'score_total':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you sleep long! You can ask me more about your sleep :)`);
									break;
								case 'score_deep':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you had a lot of deep sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_rem':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you had a lot of rem sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_efficiency':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you slept effieciently. You can ask me more about your sleep :)`);
									break;
								case 'score_latency':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that fell asleep very soon. You can ask me more about your sleep :)`);
									break;
								case 'score_disturbances':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that had low disturbances. You can ask me more about your sleep :)`);
									
									break;
								case 'score_alignment':
									session.endDialog(`Glad to hear that! Your sleeping score was ${sleep.score}. Best part of your sleep was that you went to bed correct time. You can ask me more about your sleep :)`);

									break;
							}


							break;

						case 'Not so great.':

							var keys = [
									'score_total',
									'score_deep',
									'score_rem',
									'score_efficiency',
									'score_latency',
									'score_disturbances',
									'score_alignment',
								];


								var smallestKey = keys[0];
								var smallestValue = sleep[smallestKey];
								_.forEach(keys, key => {
									if (sleep[key] < smallestValue) {
										smallestValue = sleep[key];
										smallestKey = key;
									}
								});


								switch (smallestKey) {
									case 'score_total':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you slept too short. You can ask me more about your sleep :)`);
										break;
									case 'score_deep':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too little deep sleep. You can ask me more about your sleep :)`);
										break;
									case 'score_rem':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too little rem sleep. You can ask me more about your sleep :)`);
										break;
									case 'score_efficiency':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that your sleep was not efficient. You can ask me more about your sleep :)`);
										break;
									case 'score_latency':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you spent too much time before falling asleep. You can ask me more about your sleep :)`);
										break;
									case 'score_disturbances':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too much disturbations. You can ask me more about your sleep :)`);
										
										break;
									case 'score_alignment':
										session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you went to bed bad time. You can ask me more about your sleep :)`);

										break;
								}

							break;

						case 'Awful!':

							var keys = [
								'score_total',
								'score_deep',
								'score_rem',
								'score_efficiency',
								'score_latency',
								'score_disturbances',
								'score_alignment',
							];


							var smallestKey = keys[0];
							var smallestValue = sleep[smallestKey];
							_.forEach(keys, key => {
								if (sleep[key] < smallestValue) {
									smallestValue = sleep[key];
									smallestKey = key;
								}
							});


							switch (smallestKey) {
								case 'score_total':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you slept too short. You can ask me more about your sleep :)`);
									break;
								case 'score_deep':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too little deep sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_rem':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too little rem sleep. You can ask me more about your sleep :)`);
									break;
								case 'score_efficiency':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that your sleep was not efficient. You can ask me more about your sleep :)`);
									break;
								case 'score_latency':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you spent too much time before falling asleep. You can ask me more about your sleep :)`);
									break;
								case 'score_disturbances':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you had too much disturbations. You can ask me more about your sleep :)`);
									
									break;
								case 'score_alignment':
									session.endDialog(`That's bad. Your sleeping score was ${sleep.score}. Problem last night was that you went to bed bad time. You can ask me more about your sleep :)`);

									break;
							}

							break;

					}
				}
			}
		});
	}

]);



function handleIntent(intent, data, session) {

	console.log(`Hande intent: ${intent.intent} @ ${intent.confidence}%`);

	if (intent.confidence < 0.60) {
		session.send(`I'm sorry I can't say anything to that. I can help with questions about your sleep history.`);
		return;
	}

	switch(intent.intent) {

		case 'help':
			session.send('I am Theresa, your personal sleep assistant. I work with your ŌURA Ring but for demonstration purposes I currently fetch the data from demo account. Ask me about your sleep.');

			break;

		case 'hello':
			session.send('Hello! Can I help you with something?');

			break;

		case 'thanks':
			session.send(`Please let me know if you need anything else :)`);

			break;

		case 'graph':

			var dates = [];
			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					dates.push(entity.value);
				}
			});

			if (dates.length < 2) {
				session.send(`Oops. I need a time period in order to build a graph for you.`);
				return;
			}
			else {
				dates = _.sortBy(dates, d => d);
			}

			console.log('Requesting data for');
			console.log(dates);

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${dates[0]}&end=${dates[dates.length - 1]}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
						return;
					}

					var dataForChart = [{
						x: [], 
						y: [],
						type: 'scatter'
					}];

					_.forEach(data.sleep, sleep => {
						if (sleep.score) {
							dataForChart[0].x.push(sleep.summary_date);
							dataForChart[0].y.push(sleep.score);
						}
					});

					var graphOptions = {filename: uuid(), fileopt: "overwrite"};
					plotly.plot(dataForChart, graphOptions, function (err, msg) {
						if (err) {
							session.send('Something very bad happened...');
						}
						else {

							var message = new builder.Message(session)
				            	.attachments([
				                	new builder.HeroCard(session)
				                		.text('So this is your sleep score for the days you requested')
				                    	.images([
				                        	builder.CardImage.create(session, msg.url + '.png')
				                    	])
				                    	.tap(builder.CardAction.openUrl(session, msg.url))
				            	]);

				        	session.send(message);

						}
					});
				}
			});




			break;

		case 'sleep.score':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						session.send(`Your sleep score was ${sleep.score}.`);
					});
				}
			});

			break;


		case 'sleep_problem':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						
						const keys = [
							'score_total',
							'score_deep',
							'score_rem',
							'score_efficiency',
							'score_latency',
							'score_disturbances',
							'score_alignment',
						];


						var smallestKey = keys[0];
						var smallestValue = sleep[smallestKey];
						_.forEach(keys, key => {
							if (sleep[key] < smallestValue) {
								smallestValue = sleep[key];
								smallestKey = key;
							}
						});


						switch (smallestKey) {
							case 'score_total':
								session.send(`Problem last night was that you slept too short.`);
								break;
							case 'score_deep':
								session.send(`Problem was that you had too little deep sleep.`);
								break;
							case 'score_rem':
								session.send(`Problem was that you had too little rem sleep.`);
								break;
							case 'score_efficiency':
								session.send(`Problem was that your sleep was not efficient.`);
								break;
							case 'score_latency':
								session.send(`Problem was that you spent too much time before falling asleep.`);
								break;
							case 'score_disturbances':
								session.send(`Problem was that you had too much disturbations.`);
								
								break;
							case 'score_alignment':
								session.send(`Problem was that you went to bed bad time.`);

								break;
						}

					});
				}
			});

			break;

		case 'sleep.duration':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {

						const hm = durationToHoursAndMinutes(sleep.duration);
						session.send(`Your sleep duration was ${hm.hours} hours and ${hm.minutes} minutes`);
					});
				}
			});

			break;

		case 'bedtime_end':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						const end = moment(sleep.bedtime_end);

						session.send(`You woke up at ${end.format('HH:mm')}`);
					});
				}
			});

			break;

		case 'bedtime_start':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						const end = moment(sleep.bedtime_start);

						session.send(`You went to bed at ${end.format('HH:mm')}`);
					});
				}
			});

			break;

		case 'wake_up_count':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						const count = sleep.wake_up_count;

						if (count === 0) {
							session.send(`You didn't wake up during the night. You slept like a baby ;))`);
						}
						else {
							session.send(`You slept like a Junction hacker. You woke up ${count} times`);
						}
					});
				}
			});

			break;

		case 'readiness.score':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/readiness?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.readiness.length === 0) {
						session.send('Your readiness data did not found. Please check it later :)');
					}

					_.forEach(data.readiness, readiness => {
						const score = readiness.score;
						session.send(`Your readiness score is ${score}!`);
					});
				}
			});

			break;

		case 'hr_summary':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						const hrAvg = sleep.hr_average;
						const hrLowest = sleep.hr_lowest;
						
						session.send(`Your average heart rate was ${Math.round(hrAvg)} and lowest ${Math.round(hrLowest)}`);
					});
				}
			});

			break;

		case 'sleep_summary':

			// Get date
			var date = moment().subtract({days: 1}).format('YYYY-MM-DD');

			_.forEach(data.entities, entity => {
				if (entity.entity === 'sys-date') {
					date = entity.value;
				}
			});

			if (moment(date).isAfter(moment())) {
				session.send('C\'mon my friend, I am not a phrophet..');
				return;
			}

			request.get({
				url: `https://api.ouraring.com/v1/sleep?start=${date}&end=${date}`, 
				headers: {Authorization: BEARER},
			}, (err, r, body) => {
				if (err) {
					session.send('Something very bad happened...');
				}
				else {
					const data = JSON.parse(body);
					if (data.sleep.length === 0) {
						session.send('Your sleep data did not found. Are you at Junction?');
					}

					_.forEach(data.sleep, sleep => {
						const duration = sleep.duration;
						const sleepScore = sleep.score;

						request.get({
							url: `https://api.ouraring.com/v1/readiness?start=${date}&end=${date}`, 
							headers: {Authorization: BEARER},
						}, (err, r, body) => {
							if (err) {
								session.send('Something very bad happened...');
							}
							else {
								const data = JSON.parse(body);
								if (data.readiness.length === 0) {
									session.send('Your readiness data did not found. WTF?');
								}

								_.forEach(data.readiness, readiness => {;
									const readinessScore = readiness.score;
									
									const hm = durationToHoursAndMinutes(duration);
									session.send(`You slept ${hm.hours} hours and ${hm.minutes} minutes. Your sleep score was ${sleepScore} and readiness score ${readinessScore}.`);
								});
							}
						});
					});
				}
			});

			break;

		case 'HIMYM':

			var msg = new builder.Message(session)
            	.attachments([
                	new builder.HeroCard(session)
                    	.images([
                        	builder.CardImage.create(session, 'http://az616578.vo.msecnd.net/files/2016/01/17/635886557531071372-1009885900_tumblr_static_bdj3tvirs5k4wgww44sc8k4kc.jpg')
                    	])
            	]);

        	session.send(msg);

			break;

		default:
			session.send('Thanks for asking but I have absolutely no idea what you mean... Please ask something about your sleep :)');
			break;
	}




}

function durationToHoursAndMinutes(duration) {
	var hours = Math.floor(duration / 3600);
	var minutes = Math.floor((duration - hours * 3600) / 60);
	return {
		hours,
		minutes
	};
}

function saveAddress(address) {
	var found = false;

	_.forEach(addresses, a => {
		if (a.user.id === address.user.id) {
			found = true;
		}
	});

	if (!found) {
		addresses.push(address);
	}
}

process.on('exit', _ => {
	server.close();
});