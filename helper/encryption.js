import R from 'ramda';

// CONSTANTS
const SHIFT = 4;
const REGEXP = { number: /\d/, uppercase: /[A-Z]/, lowercase: /[a-z]/ };

const cipherInt = (shift, character, modulo) => {
    const cipher = (Number(character) + shift) % modulo;
    return cipher < 0 ? cipher + modulo : cipher;
}

const cipherCharCode = (shift, character, end, modulo) => (character.charCodeAt(0) + end + shift) % modulo + end;
const pipeCipher = R.pipe(cipherCharCode, String.fromCharCode);

const encryptText = (index, text, shift, result = '') => {
    if (index == text.length) return result;

    const character = text[index];
    const encryptedCharacter = REGEXP.number.test(character) ? cipherInt(shift, character, 10) :
        (REGEXP.uppercase.test(character) ? pipeCipher(shift, character, 65, 26) : character);

    const newResult = result + encryptedCharacter;
    return encryptText(++index, text, shift, newResult);
}

const encryptPassword = (text, encrypt = true) => {
    const shift = encrypt ? SHIFT : -SHIFT;
    return encryptText(0, text, shift);
}

export default encryptPassword;
