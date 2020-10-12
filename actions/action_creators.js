import ACTIONS from './actions.js';

const addNote = (title, content, timestamp = new Date()) => ({
    type: ACTIONS.ADD_NOTE,
    payload: {
        title,
        content,
        timestamp
    }
});

const addTags = (id, tags) => ({ 
    type: ACTIONS.ADD_TAGS,
    payload: {
        "id": id,
        "tags": tags
    }
});

const deleteNote = (id) => ({ 
    type: ACTIONS.DELETE_NOTE,
    payload: {
        "id": id
    }
});

const signup = (username, password) => ({
    type: ACTIONS.SIGNUP,
    payload: {
        username,
        password
    }
});

const login = (username, password) => ({
    type: ACTIONS.LOGIN,
    payload: {
        username,
        password
    }
});

const logout = () => ({
    type: ACTIONS.LOGOUT
});

export {
    addNote,
    addTags,
    deleteNote,
    login,
    logout,
    signup
};