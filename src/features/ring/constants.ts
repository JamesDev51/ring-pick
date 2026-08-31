import type { AttributeKey, RingAttributes } from '../../types/ring';

export const ATTRIBUTE_WEIGHTS: Record<AttributeKey, number> = {
  shape: 1.3, metal: 1.15, size: 1.1, finish: 1, setting: .9, width: .85, halo: .75, profile: .6,
};

export const VALUE_DOMAINS: Record<AttributeKey, string[]> = {
  metal: ['white','yellow','rose'], shape: ['round','oval','emerald','pear','cushion'], size: ['small','medium','large'],
  width: ['thin','medium','thick'], finish: ['plain','pave'], setting: ['prong','bezel'], halo: ['none','halo'], profile: ['low','high'],
};

export const ATTRIBUTE_ORDER: AttributeKey[] = ['metal','shape','size','width','finish','setting','halo','profile'];

export const SHARE_TOKEN: Record<AttributeKey, Record<string,string>> = {
  metal:{white:'wh',yellow:'ye',rose:'ro'}, shape:{round:'rd',oval:'ov',emerald:'em',pear:'pe',cushion:'cu'}, size:{small:'sm',medium:'md',large:'lg'},
  width:{thin:'th',medium:'mw',thick:'tk'}, finish:{plain:'pl',pave:'pv'}, setting:{prong:'pr',bezel:'bz'}, halo:{none:'no',halo:'ha'}, profile:{low:'lo',high:'hi'},
};

export function attributeSimilarity(a: RingAttributes, b: RingAttributes) {
  let same = 0; let total = 0;
  for (const key of ATTRIBUTE_ORDER) { total += ATTRIBUTE_WEIGHTS[key]; if (a[key] === b[key]) same += ATTRIBUTE_WEIGHTS[key]; }
  return same / total;
}
