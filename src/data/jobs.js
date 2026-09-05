// Rotating daily "odd job" pool -- one of the two core money-making loops
// (the other being forage-and-sell). One template is picked per in-game day.
// Add a new job by adding a template here; the dialogue nodes that reference
// jobs do so generically via condition/action types, not by job id.

export const JOB_TEMPLATES = [
  {
    id: 'bread_run',
    title: 'The Bread Run',
    giver: 'mira',
    turnIn: 'cobb',
    grantsItem: 'basket_of_bread',
    requiresItem: null,
    coinReward: 15,
    friendshipReward: 2,
    giverDesc: "Mira needs someone to carry a basket of bread out to Old Cobb before it goes stale.",
    boardDesc: 'Mira Thistledown is looking for someone to run a basket of bread out to the forest edge.',
  },
  {
    id: 'herbs_for_tonics',
    title: 'Herbs for the Inn',
    giver: 'tansy',
    turnIn: 'tansy',
    grantsItem: null,
    requiresItem: 'silverleaf_herb',
    requiresQty: 2,
    coinReward: 12,
    friendshipReward: 2,
    giverDesc: 'Tansy is fresh out of silverleaf herb for her evening tonics. She needs two bundles from the forest.',
    boardDesc: 'Tansy Goodbarrel will pay well for two bundles of silverleaf herb, forest-fresh.',
  },
  {
    id: 'message_to_the_watch',
    title: 'Message to the Watch',
    giver: 'bramble',
    turnIn: 'reginald',
    grantsItem: 'sealed_letter',
    requiresItem: null,
    coinReward: 10,
    friendshipReward: 2,
    giverDesc: 'Bramble has a sealed letter about an incoming shipment that needs to reach Sir Reginald.',
    boardDesc: 'Bramble Nutmeg needs a sealed letter delivered to Sir Reginald at the watchpost.',
  },
];

export function pickJobForDay(rng) {
  return rng.pick(JOB_TEMPLATES);
}
