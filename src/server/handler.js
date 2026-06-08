var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as E from './roomEngine';
/**
 * Framework-agnostic room API. Both the Vite dev middleware and the production
 * serverless function call this with the parsed JSON payload. Every successful
 * mutation returns the caller's fresh per-player view.
 */
export function handleRoom(store, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var now, action, okView, _a, state_1, playerId, code, state, pid, _b, playerId, e_1;
        var _this = this;
        var _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    now = Date.now();
                    action = String((_c = payload === null || payload === void 0 ? void 0 : payload.action) !== null && _c !== void 0 ? _c : '');
                    okView = function (state, playerId) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, store.save(state)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, { status: 200, body: { view: E.viewFor(state, playerId, now) } }];
                            }
                        });
                    }); };
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 21, , 22]);
                    if (!(action === 'create')) return [3 /*break*/, 3];
                    _a = E.createRoom(payload.caseId, payload.name, payload.gender, now), state_1 = _a.state, playerId = _a.playerId;
                    return [4 /*yield*/, store.save(state_1)];
                case 2:
                    _f.sent();
                    return [2 /*return*/, { status: 200, body: { code: state_1.code, playerId: playerId, view: E.viewFor(state_1, playerId, now) } }];
                case 3:
                    code = String((_d = payload.code) !== null && _d !== void 0 ? _d : '').toUpperCase();
                    return [4 /*yield*/, store.get(code)];
                case 4:
                    state = _f.sent();
                    if (!state)
                        return [2 /*return*/, { status: 404, body: { error: 'الغرفة مش موجودة', code: 'ROOM_NOT_FOUND' } }];
                    pid = String((_e = payload.playerId) !== null && _e !== void 0 ? _e : '');
                    _b = action;
                    switch (_b) {
                        case 'join': return [3 /*break*/, 5];
                        case 'view': return [3 /*break*/, 7];
                        case 'update': return [3 /*break*/, 8];
                        case 'leave': return [3 /*break*/, 9];
                        case 'start': return [3 /*break*/, 11];
                        case 'begin': return [3 /*break*/, 12];
                        case 'openVote': return [3 /*break*/, 13];
                        case 'vote': return [3 /*break*/, 14];
                        case 'resolve': return [3 /*break*/, 15];
                        case 'continue': return [3 /*break*/, 16];
                        case 'reveal': return [3 /*break*/, 17];
                        case 'again': return [3 /*break*/, 18];
                    }
                    return [3 /*break*/, 19];
                case 5:
                    playerId = E.joinRoom(state, payload.name, payload.gender, now).playerId;
                    return [4 /*yield*/, store.save(state)];
                case 6:
                    _f.sent();
                    return [2 /*return*/, { status: 200, body: { playerId: playerId, view: E.viewFor(state, playerId, now) } }];
                case 7:
                    E.heartbeat(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 8:
                    E.updatePlayer(state, pid, { name: payload.name, gender: payload.gender }, now);
                    return [2 /*return*/, okView(state, pid)];
                case 9:
                    E.leaveRoom(state, pid, now);
                    return [4 /*yield*/, store.save(state)];
                case 10:
                    _f.sent();
                    return [2 /*return*/, { status: 200, body: { ok: true } }];
                case 11:
                    E.startGame(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 12:
                    E.beginInvestigation(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 13:
                    E.openVoting(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 14:
                    E.castVote(state, pid, payload.characterId, now);
                    return [2 /*return*/, okView(state, pid)];
                case 15:
                    E.resolveVoting(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 16:
                    E.continueAfterWrong(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 17:
                    E.revealTruth(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 18:
                    E.playAgain(state, pid, now);
                    return [2 /*return*/, okView(state, pid)];
                case 19: return [2 /*return*/, { status: 400, body: { error: 'طلب مش معروف', code: 'BAD_ACTION' } }];
                case 20: return [3 /*break*/, 22];
                case 21:
                    e_1 = _f.sent();
                    if (e_1 instanceof E.RoomError)
                        return [2 /*return*/, { status: 400, body: { error: e_1.message, code: e_1.code } }];
                    return [2 /*return*/, { status: 500, body: { error: 'حصل خطأ في السيرفر', code: 'SERVER_ERROR' } }];
                case 22: return [2 /*return*/];
            }
        });
    });
}
