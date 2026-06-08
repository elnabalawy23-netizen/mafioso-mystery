var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { assignCharacters } from '../game/assignment';
import { cluesFor, explanationFor, getCaseById, pickCulprit, MIN_PLAYERS } from '../data/cases';
var CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
var DISCONNECT_MS = 20000;
function randomString(len, alphabet) {
    if (alphabet === void 0) { alphabet = CODE_ALPHABET; }
    var out = '';
    for (var i = 0; i < len; i++)
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
}
export function newRoomCode() {
    return randomString(4);
}
export function newPlayerId() {
    return 'p_' + randomString(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
}
function requireCase(caseId) {
    var c = getCaseById(caseId);
    if (!c)
        throw new RoomError('القضية مش موجودة', 'CASE_NOT_FOUND');
    return c;
}
function maxPlayers(c) {
    return c.characters.length;
}
var RoomError = /** @class */ (function (_super) {
    __extends(RoomError, _super);
    function RoomError(message, code) {
        if (code === void 0) { code = 'BAD_REQUEST'; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        return _this;
    }
    return RoomError;
}(Error));
export { RoomError };
function host(state) {
    return state.players.find(function (p) { return p.isHost; });
}
function requireHost(state, playerId) {
    var _a;
    if (((_a = host(state)) === null || _a === void 0 ? void 0 : _a.id) !== playerId)
        throw new RoomError('ده تصرّف لمنظّم الغرفة بس', 'NOT_HOST');
}
function player(state, playerId) {
    var p = state.players.find(function (x) { return x.id === playerId; });
    if (!p)
        throw new RoomError('اللاعب مش في الغرفة', 'NOT_IN_ROOM');
    return p;
}
// ---- Mutations (each returns the updated state; throws RoomError on misuse) ----
export function createRoom(caseId, hostName, hostGender, now) {
    requireCase(caseId);
    var name = hostName.trim();
    if (!name)
        throw new RoomError('اكتب اسمك الأول');
    var id = newPlayerId();
    var state = {
        code: newRoomCode(),
        caseId: caseId,
        phase: 'lobby',
        players: [{ id: id, name: name, gender: hostGender, isHost: true, joinedAt: now, lastSeen: now, vote: null }],
        criminalId: null,
        assignments: {},
        revealedClues: 0,
        wrongAttempts: 0,
        lastAccusedId: null,
        round: 0,
        createdAt: now,
        updatedAt: now,
    };
    return { state: state, playerId: id };
}
export function joinRoom(state, name, gender, now) {
    if (state.phase !== 'lobby')
        throw new RoomError('اللعبة بدأت خلاص، مش هتقدر تدخل دلوقتي', 'ALREADY_STARTED');
    var c = requireCase(state.caseId);
    if (state.players.length >= maxPlayers(c))
        throw new RoomError('الغرفة مليانة', 'ROOM_FULL');
    var trimmed = name.trim();
    if (!trimmed)
        throw new RoomError('اكتب اسمك الأول');
    var id = newPlayerId();
    state.players.push({ id: id, name: trimmed, gender: gender, isHost: false, joinedAt: now, lastSeen: now, vote: null });
    state.updatedAt = now;
    return { state: state, playerId: id };
}
export function updatePlayer(state, playerId, patch, now) {
    var p = player(state, playerId);
    if (state.phase !== 'lobby')
        throw new RoomError('مش هتقدر تغيّر دلوقتي', 'ALREADY_STARTED');
    if (patch.name !== undefined) {
        var n = patch.name.trim();
        if (n)
            p.name = n;
    }
    if (patch.gender)
        p.gender = patch.gender;
    p.lastSeen = now;
    state.updatedAt = now;
    return state;
}
export function heartbeat(state, playerId, now) {
    var p = state.players.find(function (x) { return x.id === playerId; });
    if (p)
        p.lastSeen = now;
    return state;
}
export function leaveRoom(state, playerId, now) {
    var _a;
    var idx = state.players.findIndex(function (x) { return x.id === playerId; });
    if (idx === -1)
        return state;
    var wasHost = state.players[idx].isHost;
    // In the lobby, players can drop out entirely; mid-game we keep their slot
    // (their character is in play) but they'll show as disconnected.
    if (state.phase === 'lobby') {
        state.players.splice(idx, 1);
    }
    else {
        state.players[idx].lastSeen = 0;
    }
    if (wasHost && state.players.length) {
        var next_1 = (_a = state.players.find(function (p) { return p.id !== playerId; })) !== null && _a !== void 0 ? _a : state.players[0];
        state.players.forEach(function (p) { return (p.isHost = p.id === next_1.id); });
    }
    state.updatedAt = now;
    return state;
}
export function startGame(state, playerId, now) {
    requireHost(state, playerId);
    if (state.phase !== 'lobby')
        throw new RoomError('اللعبة بدأت خلاص', 'ALREADY_STARTED');
    if (state.players.length < MIN_PLAYERS) {
        throw new RoomError("\u0645\u062D\u062A\u0627\u062C\u064A\u0646 ".concat(MIN_PLAYERS, " \u0644\u0627\u0639\u0628\u064A\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644"), 'NOT_ENOUGH_PLAYERS');
    }
    dealRoles(state, now);
    return state;
}
function dealRoles(state, now) {
    var c = requireCase(state.caseId);
    var genders = new Set(state.players.map(function (p) { return p.gender; }));
    var criminalId = pickCulprit(c, genders);
    var assignments = assignCharacters(c, state.players.map(function (p) { return ({ name: p.id, gender: p.gender }); }), // use id as key
    criminalId);
    state.assignments = {};
    for (var _i = 0, assignments_1 = assignments; _i < assignments_1.length; _i++) {
        var a = assignments_1[_i];
        state.assignments[a.player] = a.character.id;
    }
    state.criminalId = criminalId;
    state.phase = 'roles';
    state.revealedClues = 0;
    state.wrongAttempts = 0;
    state.lastAccusedId = null;
    state.players.forEach(function (p) { return (p.vote = null); });
    state.updatedAt = now;
}
export function beginInvestigation(state, playerId, now) {
    requireHost(state, playerId);
    if (state.phase !== 'roles')
        throw new RoomError('مش وقتها', 'BAD_PHASE');
    state.phase = 'clues';
    state.revealedClues = 1;
    state.updatedAt = now;
    return state;
}
export function openVoting(state, playerId, now) {
    requireHost(state, playerId);
    if (state.phase !== 'clues' && state.phase !== 'wrong')
        throw new RoomError('مش وقتها', 'BAD_PHASE');
    state.players.forEach(function (p) { return (p.vote = null); });
    state.phase = 'voting';
    state.updatedAt = now;
    return state;
}
export function castVote(state, playerId, characterId, now) {
    if (state.phase !== 'voting')
        throw new RoomError('مفيش تصويت دلوقتي', 'BAD_PHASE');
    var p = player(state, playerId);
    var c = requireCase(state.caseId);
    if (!c.characters.some(function (ch) { return ch.id === characterId; }))
        throw new RoomError('مشتبه مش موجود', 'BAD_TARGET');
    p.vote = characterId;
    p.lastSeen = now;
    state.updatedAt = now;
    return state;
}
/** Tally votes to a single accusation (plurality; ties broken at random). */
function tally(state) {
    var _a;
    var counts = new Map();
    for (var _i = 0, _b = state.players; _i < _b.length; _i++) {
        var p = _b[_i];
        if (p.vote)
            counts.set(p.vote, ((_a = counts.get(p.vote)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    if (!counts.size)
        return null;
    var max = Math.max.apply(Math, counts.values());
    var top = __spreadArray([], counts.entries(), true).filter(function (_a) {
        var n = _a[1];
        return n === max;
    }).map(function (_a) {
        var id = _a[0];
        return id;
    });
    return top[Math.floor(Math.random() * top.length)];
}
export function resolveVoting(state, playerId, now) {
    requireHost(state, playerId);
    if (state.phase !== 'voting')
        throw new RoomError('مفيش تصويت يتقفل', 'BAD_PHASE');
    var accused = tally(state);
    if (!accused)
        throw new RoomError('محدش صوّت لسه', 'NO_VOTES');
    state.lastAccusedId = accused;
    if (accused === state.criminalId) {
        state.phase = 'solved';
    }
    else {
        state.wrongAttempts += 1;
        state.phase = 'wrong';
    }
    state.updatedAt = now;
    return state;
}
export function continueAfterWrong(state, playerId, now) {
    var _a;
    requireHost(state, playerId);
    if (state.phase !== 'wrong')
        throw new RoomError('مش وقتها', 'BAD_PHASE');
    var c = requireCase(state.caseId);
    var total = cluesFor(c, (_a = state.criminalId) !== null && _a !== void 0 ? _a : c.criminalId).length;
    if (state.revealedClues < total) {
        state.revealedClues += 1;
        state.phase = 'clues';
    }
    else {
        state.phase = 'final';
    }
    state.players.forEach(function (p) { return (p.vote = null); });
    state.updatedAt = now;
    return state;
}
export function revealTruth(state, playerId, now) {
    requireHost(state, playerId);
    state.phase = 'final';
    state.updatedAt = now;
    return state;
}
export function playAgain(state, playerId, now) {
    requireHost(state, playerId);
    if (state.phase !== 'solved' && state.phase !== 'final')
        throw new RoomError('مش وقتها', 'BAD_PHASE');
    state.round += 1;
    dealRoles(state, now);
    return state;
}
export function viewFor(state, playerId, now) {
    var _a, _b, _c, _d, _e;
    var c = requireCase(state.caseId);
    var me = (_a = state.players.find(function (p) { return p.id === playerId; })) !== null && _a !== void 0 ? _a : null;
    var over = state.phase === 'solved' || state.phase === 'final';
    var charById = new Map(c.characters.map(function (ch) { return [ch.id, ch]; }));
    var myCharId = me ? state.assignments[me.id] : undefined;
    var myChar = myCharId ? (_b = charById.get(myCharId)) !== null && _b !== void 0 ? _b : null : null;
    var totalClues = state.criminalId ? cluesFor(c, state.criminalId).length : c.clues.length;
    var revealed = state.criminalId
        ? cluesFor(c, state.criminalId).slice(0, state.revealedClues)
        : [];
    var solution = null;
    if (over && state.criminalId) {
        var criminal = charById.get(state.criminalId);
        var culpritPlayer = (_c = state.players.find(function (p) { return state.assignments[p.id] === state.criminalId; })) !== null && _c !== void 0 ? _c : null;
        solution = {
            criminalId: state.criminalId,
            criminalName: criminal.name,
            culpritPlayerName: (_d = culpritPlayer === null || culpritPlayer === void 0 ? void 0 : culpritPlayer.name) !== null && _d !== void 0 ? _d : null,
            accusedId: state.lastAccusedId,
            explanation: explanationFor(c, state.criminalId),
            cast: state.players.map(function (p) {
                var _a, _b;
                var ch = charById.get(state.assignments[p.id]);
                return { playerName: p.name, characterId: (_a = ch === null || ch === void 0 ? void 0 : ch.id) !== null && _a !== void 0 ? _a : '', characterName: (_b = ch === null || ch === void 0 ? void 0 : ch.name) !== null && _b !== void 0 ? _b : '—' };
            }),
        };
    }
    return {
        code: state.code,
        phase: state.phase,
        round: state.round,
        you: me ? { id: me.id, name: me.name, gender: me.gender, isHost: me.isHost } : null,
        players: state.players.map(function (p) { return ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            isHost: p.isHost,
            connected: now - p.lastSeen < DISCONNECT_MS,
            hasVoted: p.vote != null,
        }); }),
        case: {
            id: c.id,
            title: c.title,
            theme: c.theme,
            difficulty: c.difficulty,
            description: c.description,
            victim: c.victim,
        },
        // Suspect roster for the voting screen — public info only, no secrets.
        suspects: c.characters.map(function (ch) { return ({
            id: ch.id,
            name: ch.name,
            age: ch.age,
            gender: ch.gender,
            occupation: ch.occupation,
        }); }),
        myCharacter: myChar ? __assign(__assign({}, myChar), { amICulprit: myChar.id === state.criminalId }) : null,
        clues: revealed,
        revealedClues: state.revealedClues,
        totalClues: totalClues,
        votesIn: state.players.filter(function (p) { return p.vote != null; }).length,
        myVote: (_e = me === null || me === void 0 ? void 0 : me.vote) !== null && _e !== void 0 ? _e : null,
        solution: solution,
    };
}
