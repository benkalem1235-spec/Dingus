export const mapPopulation={de_dust2:8,de_inferno:8,cs_office:6,de_nuke:6,de_train:8,de_aztec:6,cs_italy:6,cs_assault:8,arena_crossfire:8,arena_stalkyard:6,arena_officecomplex:4};
// A small, slow variation in the total-player target; YaPB fill removes a bot for each joining human.
export function populationTarget(map,maximum,phase=0){const delta=[0,-1,1][Math.abs(phase)%3];return Math.max(2,Math.min(maximum-1,(mapPopulation[map]||6)+delta));}
