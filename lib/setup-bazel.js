"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var tc = __importStar(require("@actions/tool-cache"));
var core = __importStar(require("@actions/core"));
var fs = __importStar(require("fs"));
var IS_WINDOWS = process.platform === 'win32';
var PACKAGE_NAME = 'bazel';
function getURL(version) {
    var version_regex = /VERSION/gi;
    var platform_regex = /PLATFORM/gi;
    var template_url = 'https://github.com/bazelbuild/bazel/releases/download/VERSION/bazel-VERSION-PLATFORM';
    if (IS_WINDOWS) {
        return template_url
            .replace(version_regex, version)
            .replace(platform_regex, 'windows-x86_64.exe');
    }
    else {
        return template_url
            .replace(version_regex, version)
            .replace(platform_regex, 'linux-x86_64');
    }
}
function getFileName() {
    if (IS_WINDOWS) {
        return 'bazel.exe';
    }
    else {
        return 'bazel';
    }
}
function addBazelToToolCache(version) {
    return __awaiter(this, void 0, void 0, function () {
        var binary;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, tc.downloadTool(getURL(version))];
                case 1:
                    binary = _a.sent();
                    if (!IS_WINDOWS) {
                        // The downloaded bazel file is not executable by default
                        fs.chmodSync(binary, 511);
                    }
                    return [4 /*yield*/, tc.cacheFile(binary, getFileName(), PACKAGE_NAME, version)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function addBazelToPath(version) {
    return __awaiter(this, void 0, void 0, function () {
        var tool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tool = tc.find(PACKAGE_NAME, version);
                    if (!!tool) return [3 /*break*/, 2];
                    return [4 /*yield*/, addBazelToToolCache(version)];
                case 1:
                    tool = _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, core.addPath(tool)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.addBazelToPath = addBazelToPath;
