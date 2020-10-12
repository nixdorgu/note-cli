import fs from 'fs';
import redux from 'redux';
import reducer from './reducer.js';
import Maybe from 'folktale/maybe/index.js';
import R from 'ramda';

const FILE_PATH = 'database.json';

// String -> Maybe
const getJsonFile = (path) => {
    if (!fs.existsSync(path)) return Maybe.Nothing();
    return Maybe.of(fs.readFileSync(path, 'utf-8'));
}

// Maybe -> Maybe
const database = (data) => data.getOrElse(JSON.stringify({ currentUser: {}, users: [], notes: {} }, null, 2));

// Maybe -> Object
const jsonToObject = (data) => JSON.parse(data);

const getData = R.pipe(
    getJsonFile,
    database,
    jsonToObject
);

const configureStore = redux.createStore(reducer, getData(FILE_PATH));

export {configureStore, FILE_PATH};