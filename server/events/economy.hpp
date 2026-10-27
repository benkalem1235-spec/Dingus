// CSGOMod model deployment approach adapted to Metamod-FWGS (no AMXX/ReAPI).
// See licenses/CSGOMod-MIT.txt for upstream permission notice.
#include <cstdio>
#include <cstdlib>
#include <string>
#include <ctime>
#include <unistd.h>
struct EconPlayer{std::string address;int team=0;float since=0;int equipped[4]={0,0,0,0};};
static EconPlayer econPlayers[33];
static const char* econWeapons[]={"ak47","m4a1","deagle","knife"};
static std::string econBoot;
static std::string econModels[4][4][3];
static unsigned long econSequence=0;
static int econRound=0,econMessage=0,econRecipient=0,econByteCount=0,econBytes[8];
static std::string econStrings[4];static int econStringCount=0;
static float econRoundStart=0;static bool econRoundEnded=true;
static int econDeath=0,econTeam=0,econText=0,econHltv=0;
static int econIndex(edict_t* e){return e?g_engfuncs.pfnIndexOfEdict(e):0;}
static bool econAddress(const char* address){if(!address||strlen(address)>60)return false;for(const char*p=address;*p;p++)if(!strchr("0123456789.:",*p))return false;return !strncmp(address,"127.",4);}
static void econEmit(const char*kind,int index,bool flag){
 if(index<1||index>32||!econAddress(econPlayers[index].address.c_str()))return;
 const char*port=getenv("DINGUS_ROOM_PORT");if(!port)return;char file[128];snprintf(file,sizeof(file),"/events/%s.jsonl",port);
 FILE*f=fopen(file,"a");if(!f)return;
 fprintf(f,"{\"boot\":\"%s\",\"seq\":%lu,\"kind\":\"%s\",\"actor\":\"%s\",\"bot\":%d,\"win\":%d,\"round\":%d}\n",econBoot.c_str(),++econSequence,kind,econPlayers[index].address.c_str(),flag,flag,econRound);fclose(f);
}
static void econReset(){
 unsigned char bytes[12]={};FILE*f=fopen("/dev/urandom","rb");if(f){fread(bytes,1,sizeof(bytes),f);fclose(f);}char b[25];for(int i=0;i<12;i++)snprintf(b+i*2,3,"%02x",bytes[i]);econBoot=b;econSequence=0;econRound=0;econRoundEnded=true;
 for(int i=0;i<33;i++)econPlayers[i]=EconPlayer();
 for(int w=0;w<4;w++)for(int v=1;v<=4;v++)for(int prefix=0;prefix<3;prefix++){char file[128];snprintf(file,sizeof(file),"models/dingus/%s_%s_%d.mdl",prefix==0?"v":prefix==1?"p":"w",econWeapons[w],v);auto&name=econModels[w][v-1][prefix];if(name.empty())name=file;g_engfuncs.pfnPrecacheModel((char*)name.c_str());}
 econDeath=econTeam=econText=econHltv=0;
}
static qboolean econConnect(edict_t*e,const char*,const char*address,char*){
 int i=econIndex(e);if(i>0&&i<=32){econPlayers[i]=EconPlayer();if(econAddress(address))econPlayers[i].address=address;econPlayers[i].since=gpGlobals->time;}
 RETURN_META_VALUE(MRES_IGNORED,TRUE);
}
static void econDisconnect(edict_t*e){int i=econIndex(e);if(i>0&&i<=32)econPlayers[i]=EconPlayer();RETURN_META(MRES_IGNORED);}
// Only a server/RCON command can set equipment, resolved by the bridge's actual UDP endpoint.
static void econEquip(){
 if(g_engfuncs.pfnCmd_Argc()!=6)return;
 std::string address=g_engfuncs.pfnCmd_Argv(1);if(!econAddress(address.c_str()))return;
 int variants[4];for(int w=0;w<4;w++){const char*s=g_engfuncs.pfnCmd_Argv(w+2);if(strlen(s)!=1||s[0]<'0'||s[0]>'4')return;variants[w]=s[0]-'0';}
 for(int i=1;i<=32;i++)if(econPlayers[i].address==address)for(int w=0;w<4;w++)econPlayers[i].equipped[w]=variants[w];
}
static void econStatus(){char line[512];for(int i=1;i<=32;i++){auto&p=econPlayers[i];if(p.address.empty())continue;auto*e=g_engfuncs.pfnPEntityOfEntIndex(i);snprintf(line,sizeof(line),"slot=%d endpoint=%s team=%d equipped=%d,%d,%d,%d alive=%d view=%s held=%s round=%d ended=%d\n",i,p.address.c_str(),p.team,p.equipped[0],p.equipped[1],p.equipped[2],p.equipped[3],player(e),valid(e)?STRING(e->v.viewmodel):"",valid(e)?STRING(e->v.weaponmodel):"",econRound,econRoundEnded);g_engfuncs.pfnServerPrint(line);}}
static void econPostThink(edict_t*e){
 int i=econIndex(e);if(i<1||i>32||!player(e))RETURN_META(MRES_IGNORED);
 const char*view=STRING(e->v.viewmodel);
 for(int w=0;w<4;w++){
  char base[96],custom[128];snprintf(base,sizeof(base),"models/v_%s.mdl",econWeapons[w]);snprintf(custom,sizeof(custom),"models/dingus/v_%s_",econWeapons[w]);
  if(strcmp(view,base)&&strncmp(view,custom,strlen(custom)))continue;
  int v=econPlayers[i].equipped[w];char replacement[128],held[128];
  if(v){snprintf(replacement,sizeof(replacement),"models/dingus/v_%s_%d.mdl",econWeapons[w],v);snprintf(held,sizeof(held),"models/dingus/p_%s_%d.mdl",econWeapons[w],v);}else{snprintf(replacement,sizeof(replacement),"models/v_%s.mdl",econWeapons[w]);snprintf(held,sizeof(held),"models/p_%s.mdl",econWeapons[w]);}
  if(strcmp(view,replacement))e->v.viewmodel=g_engfuncs.pfnAllocString(replacement);
  if(strcmp(STRING(e->v.weaponmodel),held))e->v.weaponmodel=g_engfuncs.pfnAllocString(held);break;
 }
 RETURN_META(MRES_IGNORED);
}
static void econMessageBegin(int,int type,const float*,edict_t*e){
 if(!econDeath){econDeath=GET_USER_MSG_ID(&Plugin_info,"DeathMsg",nullptr);econTeam=GET_USER_MSG_ID(&Plugin_info,"TeamInfo",nullptr);econText=GET_USER_MSG_ID(&Plugin_info,"TextMsg",nullptr);econHltv=GET_USER_MSG_ID(&Plugin_info,"HLTV",nullptr);}
 econMessage=type;econRecipient=econIndex(e);econByteCount=econStringCount=0;RETURN_META(MRES_IGNORED);
}
static void econWriteByte(int value){if(econByteCount<8)econBytes[econByteCount++]=value;RETURN_META(MRES_IGNORED);}
static void econWriteString(const char*value){if(econStringCount<4)econStrings[econStringCount++]=value?value:"";RETURN_META(MRES_IGNORED);}
static void econMessageEnd(){
 if(econMessage==econTeam&&econByteCount>=1&&econStringCount){int i=econBytes[0];if(i>0&&i<=32){int team=econStrings[0]=="CT"?2:econStrings[0]=="TERRORIST"?1:0;if(team!=econPlayers[i].team){econPlayers[i].team=team;econPlayers[i].since=gpGlobals->time;}}}
 if(econMessage==econHltv&&econByteCount>=2&&econBytes[0]==0&&econBytes[1]==0){econRound++;econRoundStart=gpGlobals->time;econRoundEnded=false;}
 if(econMessage==econDeath&&econByteCount>=2&&!econRoundEnded){int k=econBytes[0],v=econBytes[1];if(k>0&&k<=32&&v>0&&v<=32&&k!=v&&econPlayers[k].team&&econPlayers[v].team&&econPlayers[k].team!=econPlayers[v].team){edict_t*victim=g_engfuncs.pfnPEntityOfEntIndex(v);econEmit("kill",k,victim&&(victim->v.flags&FL_FAKECLIENT));}}
 if(econMessage==econText&&!econRoundEnded){int winner=-1;for(int i=0;i<econStringCount;i++){
  const auto&s=econStrings[i];if(s=="#CTs_Win"||s=="#Bomb_Defused"||s=="#All_Hostages_Rescued"||s=="#CTs_PreventEscape"||s=="#Escaping_Terrorists_Neutralized"||s=="#VIP_Escaped")winner=2;
  if(s=="#Terrorists_Win"||s=="#Target_Bombed"||s=="#Hostages_Not_Rescued"||s=="#Terrorists_Escaped"||s=="#VIP_Assassinated"||s=="#VIP_Not_Escaped")winner=1;if(s=="#Round_Draw")winner=0;
 }if(winner>=0){econRoundEnded=true;for(int i=1;i<=gpGlobals->maxClients&&i<=32;i++){auto&p=econPlayers[i];edict_t*e=g_engfuncs.pfnPEntityOfEntIndex(i);if(valid(e)&&(e->v.flags&FL_CLIENT)&&!(e->v.flags&FL_FAKECLIENT)&&p.team&&gpGlobals->time-std::fmax(econRoundStart,p.since)>=15)econEmit("round",i,p.team==winner);}}}
 econMessage=0;RETURN_META(MRES_IGNORED);
}
static int econEngineApi(enginefuncs_t*table,int*version){if(*version!=ENGINE_INTERFACE_VERSION)return 0;memset(table,0,sizeof(*table));table->pfnMessageBegin=econMessageBegin;table->pfnWriteByte=econWriteByte;table->pfnWriteString=econWriteString;table->pfnMessageEnd=econMessageEnd;return 1;}
