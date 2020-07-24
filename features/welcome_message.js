module.exports = function(controller) {
    // handle a channel join event
    // Define a asking contact info convo first
    const MongoClient = require('mongodb').MongoClient;
    const { Botkit, BotkitConversation } = require('botkit');
    const MY_DIALOG_ID = 'GREETINGS_DIALOG';
    let convo = new BotkitConversation(MY_DIALOG_ID, controller);
    // send a greeting
    convo.say('Welcome to MDout. I am MDbot. I am here to assist you');

    // ask a question, store the response in 'name'
    convo.ask('May I get your first name please?', async(response, convo, bot) => {
        if (!response){
            convo.repeat()
        }
        else{
            console.log(`user first name is ${ response }`);
        }
        
        // do something?
    }, 'name');
    // Get last name of the user
    convo.addQuestion('May I get your last name please', async(response, convo, bot) =>{
        if (!response){
            convo.repeat()
        }
        else{
            console.log(`user last name is ${ response }`);
        }
    }, 'last_name');
    
    // use add action to switch to a different thread, defined below...
    convo.addAction('user_email');
    
    // add a message and a prompt to a new thread called `user_email`
    convo.addMessage('Awesome {{vars.name}}!', 'user_email');
    convo.addQuestion('Now, can I get your email please?', async(response, convo, bot) => {
        if (!response){
            await convo.repeat()
        }
        else if (/^([a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+\.[a-zA-Z]+)$/.test(response)){
            await convo.gotoThread('confirmation')
            console.log(`user email is ${ response }`);
        }
        else {
            await convo.repeat()
        }
    },'email', 'user_email');
    // add a question to let user retype email
    convo.addAction('retype_email');
    convo.addQuestion('Could you please re-enter your email here then?', async(response, convo, bot) => {
        if (!response){
            convo.repeat()
        }
        else if (/^([a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+\.[a-zA-Z]+)$/.test(response)){
            await convo.gotoThread('confirmation')
            console.log(`user email is ${ response }`);
        }
        else{

            await convo.repeat()
        }
    },'email', 'retype_email');
    // Closing message
    convo.addMessage({
        text:'Thank you {{vars.name}}!! Your contact info has now been securely stored in our dabase. What can I help you with today?'
    },'closing')
    // Get user's phone number
    convo.addAction('get_number');
    convo.addQuestion('Could you please provide your phone number then?', async(response, convo, bot) => {
        if (!response){
            convo.repeat()
        }
        else if (/^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(response)){
            console.log(`user phone number is ${ response }`);
            
            await convo.gotoThread('get_customer_type');
            // await convo.gotoThread('user_type');
        }

    }, 'phone_num', 'get_number');

    convo.addAction('get_customer_type');
    convo.addQuestion('Are you a clinc member or a patient? Please type c for clinic and p for patient for short:',async(response,convo,bot) =>{
        if (/^(p|c)$/.test(response.toLowerCase())){
            await convo.gotoThread('closing')
        }
        else{
            convo.repeat()
        }
    }, 'type', 'get_customer_type')




    // go to a confirmation
    convo.addAction('confirmation' ,'user_email');
    
    // do a simple conditional branch looking for user to say "no"
    convo.addQuestion('Your email is {{vars.email}}. Is that correct?',async(response, convo, bot) =>{
        if (!response){
            await convo.repeat()
        }
        else if (['yes','yeah', 'yep', 'correct','that\'s right '].includes(response.toLowerCase())){
            await convo.gotoThread('get_number');
            console.log(`user email is ${ response }`);
        }
        else if (['no','nah','nope','not really'].includes(response.toLowerCase())){
            await convo.gotoThread('retype_email');
        }
    }, 'confirm', 'confirmation')

    // Saving convo results:
    convo.after(async(results,bot) => {
        console.log("Created profile just ended. Here are the results:",results)
        results['tstamp'] = new Date().toISOString();
        //const uri = "mongodb://127.0.0.1:27017/";
        const uri = "mongodb://useradmin:HondaS2k@44.233.12.3:27017/?retryWrites=true";
        MongoClient.connect(uri,{ useUnifiedTopology: true } , function (err, db) {
            var dbo = db.db("MDbot");
            myobj = results;
            dbo.collection("sign_up").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            if(err) throw err;

                    
            });
        });

    });
    controller.addDialog(convo);

    // handle a message event

    // controller.on('welcome_back', conductOnboarding);

    // function conductOnboarding(bot, message) {
    //     console.log("The user is back")
    //     //bot.reply(message,'Welcome to the channel!');
    //     //bot.beginDialog('GREETINGS_DIALOG');
    // }
    controller.on('welcome_back', async (bot, message) => {
 
        console.log("user back");
        //await bot.reply(message,'Welcome to MDout. I am MDbot. I am here to assist you');
        await bot.beginDialog('GREETINGS_DIALOG');
       
    });   
        
    

}