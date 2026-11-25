import {STUDIO_WORKSPACE} from '../../lib/studio-workspace.js';
import {operatorAuthorized,sceneReply} from '../../lib/scene-core.js';
import {reviewHost} from '../../lib/release-scope.js';
export function onRequestGet({request,env}){if(!reviewHost(new URL(request.url).hostname)||!operatorAuthorized(request,env))return sceneReply({error:'Preview operator access required'},403);return sceneReply({ok:true,...STUDIO_WORKSPACE});}
