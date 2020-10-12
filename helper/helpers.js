import readline from "readline-sync";
import fs from "fs";
import R from "ramda";
import { FILE_PATH } from "../store/store.js";
import * as actionCreators from "../actions/action_creators.js";
import Result from "folktale/result/index.js";
import encryptPassword from "./encryption.js";
import Maybe from "folktale/maybe/index.js";

// HELPER FUNCTIONS [IO/SUB]


// VALIDATION HELPER
const inputIsNotEmpty = R.pipe(R.trim, R.isEmpty, R.not);

// ADD TAG HELPER
const addTag = () => {
  const tags = readline.question("Input the tags you would like to add separated by a comma [ex. school, SE]: ");

  const check = R.pipe(
    R.split(","),
    R.map(R.trim),
    R.map(R.toLower),
    R.filter(inputIsNotEmpty)
  );

  return check(tags);
};


// GET ALL NOTES HELPER
const recursiveGetNotes = (index, notes) => {
  if (index == notes.length) return;

  const tags = R.isEmpty(notes[index].tags) ? "" : `Tags: [${notes[index].tags.join(", ")}]\n`;
  console.log(`ID: ${index + 1}\nTitle: ${notes[index].title}\nContent: ${notes[index].content}\n${tags}Date Created: ${notes[index].timestamp}\n`);
  recursiveGetNotes(++index, notes);
};

const getNotes = (currentState) => {
  const user = Maybe.fromNullable(R.prop("currentUser", currentState));
  const userResult = R.equals(user, Maybe.Nothing())
    ? Result.Error("No signed in user")
    : Result.Ok(user.getOrElse());

  return userResult.chain((user) => {
    const note = R.prop("notes", currentState);
    if (!note.hasOwnProperty(user.id)) return Result.Error("No notes found.");
    if (note[user.id].length == 0) return Result.Error("No notes found.");

    return Result.Ok(note[user.id]);
  });
};

const safeGetAllNotes = (currentState) => {
  const notes = getNotes(currentState);

  return notes.matchWith({
    Ok: ({ value }) => recursiveGetNotes(0, value),
    Error: ({ value }) => console.log(`${value}`),
  });
};


// ADD TAG / DELETE NOTE HELPER
const safeTagAndDelete = (store, onOK, onError) => {
  const notes = R.pipe(R.invoker(0, "getState"), getNotes)(store);

  return notes.matchWith({
    Ok: ({ value }) => onOK(value),
    Error: ({ value }) => onError(value),
  });
};


// HELPERS FUNCTIONS [IO/MAIN]
const addNote = (store) => {
  const currentUser = store.getState()["currentUser"]["username"];
  const noteTitle = readline.question("Please input your note's title: ", {limit: (input) => inputIsNotEmpty(input), limitMessage: "Title cannot be empty."});
  const noteContent = readline.question(`Please input ${noteTitle}'s content: `, {limit: (input) => inputIsNotEmpty(input), limitMessage: "Content cannot be empty."});

  store.dispatch(actionCreators.addNote(noteTitle, noteContent));
  console.log(`Hi ${currentUser}, ${noteTitle} was added to your notes!`);
};

const addTags = (store) => {
  getAllNotes(store);

  const onOK = (value) => {
    const titles = value.map((note) => note.title);
    const id = readline.keyInSelect(
      titles,
      "Select the note you would like to add tags to: ",
      { limit: "$<titlesCount>" }
    );

    if (id !== -1) {
      const tags = addTag();

      if (!R.isEmpty(tags)) {
        store.dispatch(actionCreators.addTags(id, tags));
        console.log(`Hi ${store.getState().currentUser.username}, new tags were added to ${value[id].title}!`);
      }
        
    }
  };

  const onError = (_) => Maybe.Nothing();

  safeTagAndDelete(store, onOK, onError);
};

const deleteNote = (store) => {
  getAllNotes(store);

  const onOK = (value) => {
    const titles = value.map((note) => note.title);

    const id = readline.keyInSelect(
      titles,
      "\nPlease input id corresponding with the note you would like to delete: ",
      { limit: "$<titlesCount>" }
    );

    if (id !== -1) {
      const noteTitle = value[id].title;
      store.dispatch(actionCreators.deleteNote(id));

      console.log(
        `Hi ${
          store.getState().currentUser.username
        }, ${noteTitle} was deleted from your notes!`
      );
    }
  };

  const onError = (_) => Maybe.Nothing();

  safeTagAndDelete(store, onOK, onError);
};

const getAllNotes = R.pipe(R.invoker(0, "getState"), safeGetAllNotes);

const login = (store) => {
  const currentState = store.getState();
  const username = readline.question("Please input your username: ");
  const password = readline.question("Input your password: ", {
    hideEchoBack: true,
  });

  const checkUsername = R.isEmpty(
    R.filter((user) => user.username === username, currentState.users)
  )
    ? Result.Error("User not found")
    : Result.Ok(username);

  const checkPassword = R.isEmpty(R.filter((user) => user.password === encryptPassword(password), currentState.users))
    ? Result.Error("Incorrect password")
    : Result.Ok(`Welcome back, ${username}`);


  return checkUsername.chain((_) => checkPassword).matchWith({
    Ok: ({ value }) => {
        store.dispatch(actionCreators.login(username, password)),
        console.log(value);
    },
    Error: ({ value }) => console.log(`${value}`),
  });
};

const logout = (store) => {
  store.dispatch(actionCreators.logout());
  console.log(`We hope to see you soon!`);
};

const saveToDatabase = (store) => {
  const data = JSON.stringify(store.getState(), null, 2);
  fs.writeFileSync("./" + FILE_PATH, data);
};

const searchByTag = (store) => {
  const onOK = (value) => {
    const tag = readline
      .question("Please input the tag you're looking for: ")
      .toLowerCase();
    const tags = R.pipe(R.prop("tags"), R.pipe(R.toLower, R.includes)(tag));
    const result = R.filter(tags, value);

    result.length === 0
      ? console.log(`NO NOTES FOUND.`)
      : recursiveGetNotes(0, result);
  };

  const onError = (value) => console.log(value);

  safeTagAndDelete(store, onOK, onError);
};

const signup = (store) => {
  const currentState = store.getState();
  const username = readline.question("Please input your username: ", {
    limit: (input) => inputIsNotEmpty(input) && /[A-Za-z0-9]/g,
    limitMessage: "Username must be composed of alphanumeric characters only.",
  });

  const checkUsername =
    currentState.users.filter((user) => user.username === username).length != 0
      ? Result.Error(`Uh-oh, seems like ${username} is already taken.`)
      : Result.Ok(`Welcome ${username}`);

  return checkUsername.matchWith({
    Ok: ({ value }) => {
      const password = readline.questionNewPassword("Input your password: ", {
        charlist: "$<A-Z>$<0-9>!./|}{#$%^&*()@",
        min: 8,
        max: 12,
      });

      store.dispatch(actionCreators.signup(username, password));
      console.log(value);
    },
    Error: ({ value }) => console.log(value),
  });
};

export {
  addNote,
  addTags,
  deleteNote,
  getAllNotes,
  login,
  logout,
  saveToDatabase,
  searchByTag,
  signup,
};