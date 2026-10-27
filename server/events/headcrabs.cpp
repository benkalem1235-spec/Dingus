// SPDX-License-Identifier: GPL-3.0-or-later
// Server-side headcrab event for Xash3D/CS16Client through Metamod-FWGS.
#include <cmath>
#include <cstring>
#include <vector>
#include "extdll.h"
#include "eiface.h"
#include "meta_api.h"
enginefuncs_t g_engfuncs;
globalvars_t *gpGlobals=nullptr;
meta_globals_t *gpMetaGlobals=nullptr;
gamedll_funcs_t *gpGamedllFuncs=nullptr;
mutil_funcs_t *gpMetaUtilFuncs=nullptr;
plugin_info_t Plugin_info={META_INTERFACE_VERSION,"Dingus arena events","1.1.0",__DATE__,"Dingus contributors","https://github.com/benkalem1235-spec/Dingus","DINGUS",PT_STARTUP,PT_NEVER};
struct Crab{edict_t *entity;int serial;float until,jump,attack;};
static std::vector<Crab> crabs;
static float lastFrame=0,nextWave=0;
static bool ready=false;
static const char *model="models/headcrab.mdl";
static bool valid(edict_t *e){return e&&!e->free;}
static bool player(edict_t *e){return valid(e)&&e->v.health>0&&e->v.deadflag==DEAD_NO&&e->v.solid!=SOLID_NOT;}
static void announce(const char *message){
 g_engfuncs.pfnServerPrint(message);
 for(int i=1;i<=gpGlobals->maxClients;i++){edict_t *p=g_engfuncs.pfnPEntityOfEntIndex(i);if(valid(p)&&(p->v.flags&FL_CLIENT))g_engfuncs.pfnClientPrintf(p,print_center,message);}
}
static edict_t *nearest(edict_t *e){edict_t *target=nullptr;float distance=1e12f;for(int i=1;i<=gpGlobals->maxClients;i++){edict_t *p=g_engfuncs.pfnPEntityOfEntIndex(i);if(!player(p))continue;Vector delta=p->v.origin-e->v.origin;float d=delta.Length();if(d<distance){distance=d;target=p;}}return target;}
static void spawnWave(){
 if(!ready||gpGlobals->time<nextWave){g_engfuncs.pfnServerPrint("[Dingus] Headcrabs unavailable or cooling down.\n");return;}
 std::vector<edict_t*> players;for(int i=1;i<=gpGlobals->maxClients;i++){edict_t*p=g_engfuncs.pfnPEntityOfEntIndex(i);if(player(p))players.push_back(p);}
 if(players.empty()){g_engfuncs.pfnServerPrint("[Dingus] No living players for headcrab event.\n");return;}
 int spawned=0;
 for(int k=0;k<6&&crabs.size()<18;k++){
  edict_t*p=players[k%players.size()];Vector origin;bool found=false;
  for(int attempt=0;attempt<32;attempt++){
   float angle=g_engfuncs.pfnRandomFloat(0,6.2831853f),radius=g_engfuncs.pfnRandomFloat(64,240);
   Vector start=p->v.origin+Vector(std::cos(angle)*radius,std::sin(angle)*radius,12);Vector end=start-Vector(0,0,380);TraceResult tr;
   g_engfuncs.pfnTraceLine(start,end,1,p,&tr);if(tr.fStartSolid||tr.fAllSolid||tr.flFraction>=1)continue;
   origin=tr.vecEndPos+Vector(0,0,20);TraceResult hull;g_engfuncs.pfnTraceHull(origin,origin,1,3,p,&hull);if(hull.fStartSolid||hull.fAllSolid)continue;found=true;break;
  }
  if(!found)continue;
  edict_t*e=g_engfuncs.pfnCreateNamedEntity(g_engfuncs.pfnAllocString("info_target"));if(!valid(e))continue;
  gpGamedllFuncs->dllapi_table->pfnSpawn(e);
  e->v.classname=g_engfuncs.pfnAllocString("dingus_headcrab");
  g_engfuncs.pfnSetModel(e,model);Vector mins(-12,-12,0),maxs(12,12,24);g_engfuncs.pfnSetSize(e,mins,maxs);g_engfuncs.pfnSetOrigin(e,origin);
  e->v.movetype=MOVETYPE_STEP;e->v.solid=SOLID_SLIDEBOX;e->v.flags|=FL_MONSTER;e->v.health=35;e->v.max_health=35;e->v.takedamage=DAMAGE_YES;e->v.gravity=1;e->v.friction=1;e->v.sequence=3;e->v.framerate=1;e->v.frame=0;
  crabs.push_back({e,e->serialnumber,gpGlobals->time+60,gpGlobals->time+1,gpGlobals->time+1});spawned++;
 }
 if(spawned){nextWave=gpGlobals->time+90;char line[100];snprintf(line,sizeof(line),"[Dingus] Headcrab wave spawned: %d\n",spawned);announce(line);}else g_engfuncs.pfnServerPrint("[Dingus] No safe spawn space for headcrabs.\n");
}
// Read-only RCON diagnostics for converted arenas.
static void arenaStatus(){
 int ct=0,t=0,pickups=0,blocked=0;char line[240];
 for(int i=1;i<gpGlobals->maxEntities;i++){
  edict_t*e=g_engfuncs.pfnPEntityOfEntIndex(i);if(!valid(e))continue;const char*c=STRING(e->v.classname);
  if(!strcmp(c,"info_player_start")||!strcmp(c,"info_player_deathmatch")){
   if(!strcmp(c,"info_player_start"))ct++;else t++;
   TraceResult tr;g_engfuncs.pfnTraceHull(e->v.origin,e->v.origin,1,1,e,&tr);if(tr.fStartSolid||tr.fAllSolid)blocked++;
  }
  if(!strcmp(c,"armoury_entity")&&!strncmp(STRING(e->v.targetname),"dingus_hl_",10)){
   pickups++;snprintf(line,sizeof(line),"pickup %s model=%s at %.0f %.0f %.0f visible=%d\n",STRING(e->v.targetname),STRING(e->v.model),e->v.origin.x,e->v.origin.y,e->v.origin.z,!(e->v.effects&EF_NODRAW));g_engfuncs.pfnServerPrint(line);
  }
  if(i<=gpGlobals->maxClients&&(e->v.flags&FL_CLIENT)){
   snprintf(line,sizeof(line),"player %d alive=%d health=%.0f weapons=%d at %.0f %.0f %.0f model=%s\n",i,player(e),e->v.health,e->v.weapons,e->v.origin.x,e->v.origin.y,e->v.origin.z,STRING(e->v.model));g_engfuncs.pfnServerPrint(line);
  }
 }
 snprintf(line,sizeof(line),"arena CT=%d T=%d blocked_spawns=%d HL_pickups=%d\n",ct,t,blocked,pickups);g_engfuncs.pfnServerPrint(line);
}
// Fixed aerial camera presets for spectators; live players cannot use them.
struct Camera {edict_t *entity;int serial;Vector origin;float until;};
static std::vector<Camera> cameras;
static void cameraCommand(edict_t *e){
 const char *c=g_engfuncs.pfnCmd_Argv(0);
 if(strcmp(c,"dingus_cam_a")&&strcmp(c,"dingus_cam_b")&&strcmp(c,"dingus_cam_free"))RETURN_META(MRES_IGNORED);
 if(!valid(e)||(e->v.flags&FL_FAKECLIENT)||!e->v.iuser1)RETURN_META(MRES_SUPERCEDE);
 for(auto i=cameras.begin();i!=cameras.end();)if(i->entity==e)i=cameras.erase(i);else ++i;
 if(!strcmp(c,"dingus_cam_free"))RETURN_META(MRES_SUPERCEDE);
 if(strcmp(STRING(gpGlobals->mapname),"de_dust2")){g_engfuncs.pfnClientPrintf(e,print_center,"Aerial presets are available on Dust II.\n");RETURN_META(MRES_SUPERCEDE);}
 bool a=!strcmp(c,"dingus_cam_a");Vector origin=a?Vector(800,2160,320):Vector(-1880,2320,320);Vector angle(a?25:32,45,0);
 e->v.iuser1=3;e->v.iuser2=0;e->v.iuser3=0;e->v.movetype=MOVETYPE_NOCLIP;e->v.solid=SOLID_NOT;e->v.velocity=Vector(0,0,0);e->v.view_ofs=Vector(0,0,0);e->v.angles=angle;e->v.v_angle=angle;e->v.fixangle=1;g_engfuncs.pfnSetOrigin(e,origin);g_engfuncs.pfnSetView(e,e);cameras.push_back({e,e->serialnumber,origin,gpGlobals->time+600});
 RETURN_META(MRES_SUPERCEDE);
}
static void gameInit(){g_engfuncs.pfnAddServerCommand((char*)"dingus_headcrabs",spawnWave);g_engfuncs.pfnAddServerCommand((char*)"dingus_arena_status",arenaStatus);RETURN_META(MRES_IGNORED);}
static int spawn(edict_t *e){if(!strcmp(STRING(e->v.classname),"worldspawn")){g_engfuncs.pfnPrecacheModel((char*)"models/w_shotgun.mdl");g_engfuncs.pfnPrecacheModel((char*)"models/w_9mmar.mdl");crabs.clear();cameras.clear();ready=false;lastFrame=nextWave=0;g_engfuncs.pfnPrecacheModel((char*)model);g_engfuncs.pfnPrecacheSound((char*)"headcrab/hc_attack1.wav");g_engfuncs.pfnPrecacheSound((char*)"headcrab/hc_idle1.wav");ready=true;}RETURN_META_VALUE(MRES_IGNORED,0);}
static void frame(){
 for(auto i=cameras.begin();i!=cameras.end();){auto e=i->entity;if(!valid(e)||e->serialnumber!=i->serial||!e->v.iuser1||gpGlobals->time>i->until){i=cameras.erase(i);continue;}e->v.iuser1=3;e->v.iuser2=0;e->v.velocity=Vector(0,0,0);g_engfuncs.pfnSetOrigin(e,i->origin);++i;}
 float now=gpGlobals->time;if(now-lastFrame<0.1f)RETURN_META(MRES_IGNORED);lastFrame=now;
 for(auto it=crabs.begin();it!=crabs.end();){
  edict_t*e=it->entity;if(!valid(e)||e->serialnumber!=it->serial){it=crabs.erase(it);continue;}
  if(now>it->until||e->v.health<=0||e->v.deadflag!=DEAD_NO){g_engfuncs.pfnRemoveEntity(e);it=crabs.erase(it);continue;}
  edict_t*p=nearest(e);
  if(p){Vector delta=p->v.origin-e->v.origin;float distance=delta.Length(),yaw=std::atan2(delta.y,delta.x)*57.2957795f;e->v.angles.y=yaw;
   if(e->v.flags&FL_ONGROUND){g_engfuncs.pfnWalkMove(e,yaw,15,0);if(distance<320&&now>it->jump){float flat=std::sqrt(delta.x*delta.x+delta.y*delta.y);if(flat>1)e->v.velocity=Vector(delta.x/flat*260,delta.y/flat*260,220);e->v.flags&=~FL_ONGROUND;it->jump=now+1.6f;g_engfuncs.pfnEmitSound(e,CHAN_VOICE,"headcrab/hc_attack1.wav",0.65f,ATTN_NORM,0,100);}}
   e->v.frame=std::fmod(e->v.frame+12,255.f);
   if(distance<48&&now>it->attack){p->v.dmg_inflictor=e;p->v.dmg_take+=8;p->v.health-=8;it->attack=now+1;if(p->v.health<=0){p->v.health=1;gpGamedllFuncs->dllapi_table->pfnClientKill(p);}}
  }
  ++it;
 }
 RETURN_META(MRES_IGNORED);
}
// Keep native armoury touch, ammo and round reset behavior; use owned HL world models.
static int spawnPost(edict_t *e){
 if(valid(e)&&!strcmp(STRING(e->v.classname),"armoury_entity")){
  const char *name=STRING(e->v.targetname);
  if(!strcmp(name,"dingus_hl_shotgun"))g_engfuncs.pfnSetModel(e,"models/w_shotgun.mdl");
  if(!strcmp(name,"dingus_hl_smg"))g_engfuncs.pfnSetModel(e,"models/w_9mmar.mdl");
 }
 RETURN_META_VALUE(MRES_IGNORED,0);
}
static int getApiPost(DLL_FUNCTIONS *table,int *version){if(*version!=INTERFACE_VERSION){*version=INTERFACE_VERSION;return 0;}memset(table,0,sizeof(*table));table->pfnSpawn=spawnPost;return 1;}
static int getApi(DLL_FUNCTIONS *table,int *version){if(*version!=INTERFACE_VERSION){*version=INTERFACE_VERSION;return 0;}memset(table,0,sizeof(*table));table->pfnGameInit=gameInit;table->pfnSpawn=spawn;table->pfnStartFrame=frame;table->pfnClientCommand=cameraCommand;return 1;}
C_DLLEXPORT void WINAPI GiveFnptrsToDll(enginefuncs_t *functions,globalvars_t *globals){memcpy(&g_engfuncs,functions,sizeof(g_engfuncs));gpGlobals=globals;}
C_DLLEXPORT int Meta_Query(char*,plugin_info_t **info,mutil_funcs_t *util){*info=&Plugin_info;gpMetaUtilFuncs=util;return 1;}
C_DLLEXPORT int Meta_Attach(PLUG_LOADTIME,META_FUNCTIONS *functions,meta_globals_t *globals,gamedll_funcs_t *game){gpMetaGlobals=globals;gpGamedllFuncs=game;memset(functions,0,sizeof(*functions));functions->pfnGetEntityAPI2=getApi;functions->pfnGetEntityAPI2_Post=getApiPost;return 1;}
C_DLLEXPORT int Meta_Detach(PLUG_LOADTIME,PL_UNLOAD_REASON){return 0;}
