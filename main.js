import readline from 'readline-sync';
import R from 'ramda';
import {configureStore} from './store/store.js';
import * as helper from './helper/helpers.js';

const store = configureStore;

const loggedIn = {
    options: ['Add Note', 'Add Tags', 'Delete Note', 'Get All Notes', 'Search by Tag', 'Logout'],
    actions: [helper.addNote, helper.addTags, helper.deleteNote, helper.getAllNotes, helper.searchByTag, helper.logout]
}

const loggedOut = {
    options: ['Signup', 'Login'],
    actions: [helper.signup, helper.login]
}

const main = () => {
    console.log('-'.repeat(20), 'EVERNIX', '-'.repeat(20));

    const runProgram = (choice = 0) => {
        const currentUser = store.getState()['currentUser'];
        const state = R.equals(currentUser, {}) ? loggedOut : loggedIn;
        const index = readline.keyInSelect(state.options, 'What would you like to do?', { cancel: 'Exit Application.' });

        if (index !== -1) {
            state.actions[index](store);
            runProgram(index);
        } else {
            helper.saveToDatabase(store);
            return;
        }
    }

    runProgram();
}

main();