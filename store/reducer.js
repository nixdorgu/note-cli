import ACTIONS from "../actions/actions.js";
import encryptPassword from "../helper/encryption.js";
import R from "ramda";
import Maybe from "folktale/maybe/index.js";

function isLoggedIn(state) {
  const currentUser = Maybe.fromNullable(state["currentUser"]["id"]);
  return !currentUser.hasInstance(Maybe.Nothing());
}

function reducer(state = {}, action) {
  switch (action.type) {
    case ACTIONS.ADD_NOTE:
      if (isLoggedIn(state)) return state;

      const userId = state["currentUser"].id;
      const newNotes = R.append(
        {
          title: action.payload.title,
          content: action.payload.content,
          timestamp: action.payload.timestamp.toLocaleString(),
          tags: [],
        },
        state["notes"][userId]
      );

      return R.mergeDeepRight(state, { notes: { [userId]: newNotes } });

    case ACTIONS.ADD_TAGS:
      if (isLoggedIn(state)) return state;

      const currentUserId = state["currentUser"].id;
      const noteId = action.payload.id;

      // CREATE VAR FOR S-NOTES-CID // USE DOT NOTATION
      const updatedTags = R.union(
        state["notes"][currentUserId][noteId].tags,
        action.payload.tags
      );
      const updatedNote = R.mergeDeepRight(
        state["notes"][currentUserId][noteId],
        { tags: updatedTags }
      );
      const updatedNotes = R.update(
        noteId,
        updatedNote,
        state["notes"][currentUserId]
      );

      return R.mergeDeepRight(state, {
        notes: { [currentUserId]: updatedNotes },
      });

    case ACTIONS.DELETE_NOTE:
      if (isLoggedIn(state)) return state;
      if (action.payload.id >= state["notes"][state.currentUser.id].length)
        return state;

      const deleteNote = state["notes"][state.currentUser.id].filter(
        (note) =>
          note !== state["notes"][state.currentUser.id][action.payload.id]
      );
      return R.mergeDeepRight(state, {
        notes: { [state.currentUser.id]: deleteNote },
      });

    case ACTIONS.SIGNUP:
      if (
        state["users"].filter(
          (user) => user.username === action.payload.username
        ).length != 0
      )
        return state;

      const usersLength = state["users"].length;
      const password = encryptPassword(action.payload.password);
      const newUser = R.append(
        {
          id: usersLength + 1,
          username: action.payload.username,
          password: password,
        },
        state["users"]
      );

      return R.mergeDeepRight(state, {
        currentUser: newUser[usersLength],
        users: newUser,
      });

    case ACTIONS.LOGIN:
      const username = action.payload.username;
      const user = state["users"].filter((user) => user.username == username);

      if (user.length === 1) {
        const password =
          encryptPassword(action.payload.password) === user[0].password;
        return password
          ? R.mergeDeepRight(state, { currentUser: user[0] })
          : state;
      }

      return state;

    case ACTIONS.LOGOUT:
      return R.mergeRight(state, { currentUser: {} });

    default:
      return state;
  }
}

export default reducer;
