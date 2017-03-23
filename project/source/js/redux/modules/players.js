import fetch from 'isomorphic-fetch'
import { defaultPlayers } from '../../helpers/constants/defaultPlayers'
import { mergeDeep } from '../../helpers/dataUtils'
import { arrayCheck } from '../../helpers/arrayUtils'
import { 
	addPlayerToTeam,
	removePlayerFromTeam } from './teams'

const LOAD_PLAYERS_REQUEST = 'players/LOAD_PLAYERS_REQUEST'
const LOAD_PLAYERS_SUCCESS = 'players/LOAD_PLAYERS_SUCCESS'
const LOAD_PLAYERS_ERROR = 'players/LOAD_PLAYERS_ERROR'
const FORCE_LOAD_PLAYERS = 'players/FORCE_LOAD_PLAYERS'
const RECEIVE_PLAYERS = 'players/RECEIVE_PLAYERS'
const INVALIDATE_PLAYERS = 'players/INVALIDATE_PLAYERS'
const UNSYNTHESIZE_PLAYERS = 'players/UNSYNTHESIZE_PLAYERS'
const UPDATE_PLAYER_FAVORITED = 'players/UPDATE_PLAYER_FAVORITED'
const UPDATE_PLAYER_NOTES = 'players/UPDATE_PLAYER_NOTES'
const UPDATE_ACTIVE_PLAYER = 'players/UPDATE_ACTIVE_PLAYER'
const UPDATE_PLAYER_COST = 'players/UPDATE_PLAYER_COST'
const UPDATE_PLAYER_STAT = 'players/UPDATE_PLAYER_STAT'
const UPDATE_PLAYER_OWNER = 'players/UPDATE_PLAYER_OWNER'


let initialState = {
	fetching: false,
	didInvalidate: true,
	data: null,
	activePlayerId: null
}

// Prune data from server to play nicely with the app
const normalizePlayerData = (players) => {
	for (const id in players) {
		if (players.hasOwnProperty(id)) {
			const player = players[id]

			if (!player.name && player.first_name && player.last_name) {
				player.name = player.first_name + ' ' + player.last_name;
			}

			if (player.stats) {
				if (player.stats.default) {
					const stats = player.stats.default
					const newStats = {}

					for (const stat in stats) {
						if (stats.hasOwnProperty(stat)) {
							const val = stats[stat] || 0
							newStats[stat] = val
						}
					}
					player.stats = newStats
				}
			}
			player.sport = 'baseball'
		}
	}
	return players
}
/*
const synthesizePlayerData = (playerData, userPlayerData=null) => {

	for (const userPlayerId in userPlayerData) {
		if (userPlayerData.hasOwnProperty(userPlayerId)) {

			const player = playerData[userPlayerId]
			const userPlayer = userPlayerData[userPlayerId]

			for (const key in userPlayer) {
				if (userPlayer.hasOwnProperty(key)) {

					if (!player[key]) {
						player[key] = userPlayer[key]
					} else {
						Object.assign(player[key], userPlayer[key])
					}

				}
			}
		}
	}

	return mergeDeep(playerData, userPlayerData)
}*/

export const getPlayers = (endpoint) => {
	return {
		types: [LOAD_PLAYERS_REQUEST, LOAD_PLAYERS_SUCCESS, LOAD_PLAYERS_ERROR ],
		endpoint
		// payload: { didUnsynthesize: !defaultPlayers }
	}
}

export const fetchPlayers = (forceFetch = false) => {
	return (dispatch, getState) => {
		const state = getState()
		const { didInvalidate } = state.players
		const debug = !navigator.onLine //true

		if (debug) {
			return dispatch( fetchOfflinePlayerData() )
		}

		if (forceFetch) {
			dispatch( unsynthesizePlayers() )
		}

		const { uid } = state.user
		const { activeLeague } = state.leagues

		const defaultPlayerPath = '/defaults/players'
		const userPlayerPath = uid ? '/users/' + uid + '/players/' : null
		const leaguePlayerPath = (uid && activeLeague) ? '/users/' + uid + '/leagues/' + activeLeague.id + '/players/' : null

		return dispatch( fetchPlayersAtPath(defaultPlayerPath) )
			.then( players => dispatch( fetchPlayersAtPath(userPlayerPath) )
				.then( userPlayers => dispatch( fetchPlayersAtPath(leaguePlayerPath) )
					.then( leaguePlayers => {
						const defaultPlayers = players || state.players.data
						const synthesizedPlayers = mergeDeep(defaultPlayers, userPlayers, leaguePlayers)
						return dispatch(receivePlayers(synthesizedPlayers))
					}
				)
			)
	    )
	}
}

const fetchOfflinePlayerData = () => {
	return (dispatch, getState) => {
		const players = normalizePlayerData(defaultPlayers)
		dispatch( receivePlayers(players) )
		return Promise.resolve()
	}
}

const fetchPlayersAtPath = (path) => {
	return (dispatch, getState) => {
		const state = getState()
		const { fetching, didInvalidate } = state.players

		const shouldFetchPlayers = path && (didInvalidate && !fetching)

		if (shouldFetchPlayers) {
			return dispatch( getPlayers(path) ) // Load default player data
				.then( players => normalizePlayerData(players) )
		} else {
			return Promise.resolve()
		}
	}
}

const formatPlayers = (players) => {
	if (arrayCheck(players)) {
		return Array.toObject(players)	
	} else {
		return players
	}
}

export const changePlayerStat = (id, stat, value) => {
	return (dispatch, getState) => {
		console.log(id, stat)
		dispatch( updatePlayerStat(id, stat, value) )
		const players = getState().players.data
		return dispatch( receivePlayers(players) )
	}
}

export const changePlayerCost = (id, cost) => {
	return (dispatch, getState) => {
		const { owner } = getState().players.data[id]
		if ((cost === null || cost === 0) && owner) {
			dispatch( undraftPlayer(id, owner) )
		} else {
			dispatch( draftPlayer(id, cost, owner) )
		}
		const players = getState().players.data
		return dispatch( receivePlayers(players) )
	}
}

export const draftPlayer = (id, cost, teamId) => {
	return (dispatch, getState) => {
		dispatch( updatePlayerCost(id, cost) )
		if (teamId) {
			dispatch( updatePlayerOwner(id, teamId) )
			dispatch( addPlayerToTeam(id, teamId) )
		}
		const players = getState().players.data
		return dispatch( receivePlayers(players) )
	}
}

export const undraftPlayer = (id, teamId) => {
	return (dispatch, getState) => {
		dispatch( updatePlayerCost(id, null) )
		dispatch( updatePlayerOwner(id, null) )
		dispatch( removePlayerFromTeam(id, teamId) )
		const players = getState().players.data
		return dispatch( receivePlayers(players) )
	}
}

export const receivePlayers = (players) => {
	return {type: RECEIVE_PLAYERS, payload: {players}}
}

export const invalidatePlayers = () => {
	return { type: INVALIDATE_PLAYERS }
}

export const unsynthesizePlayers = () => {
	return { type: UNSYNTHESIZE_PLAYERS }
}

export const updatePlayerFavorited = (id) => {
	return { type: UPDATE_PLAYER_FAVORITED, payload: {id} }
}

export const updatePlayerStat= (id, stat, value) => {
	return {type: UPDATE_PLAYER_STAT, payload: {id, stat, value}}
}

export const updatePlayerNotes = (id, notes) => {
	return { type: UPDATE_PLAYER_NOTES, payload: {id, notes} }
}

export const updateActivePlayer = (id) => {
	return { type: UPDATE_ACTIVE_PLAYER, payload: {id} }
}

export const updatePlayerCost = (id, cost) => {
	return { type: UPDATE_PLAYER_COST, payload: {id, cost} }
}

export const updatePlayerOwner = (id, team) => {
	return { type: UPDATE_PLAYER_OWNER, payload: {id, team} }
}

const reducer = (state = initialState, action) => {

	const { payload } = action
	const { players, id, cost, value, team, notes, stat } = (payload || {})

	switch (action.type) {
		case INVALIDATE_PLAYERS:
			return Object.assign({}, state, {
				didInvalidate: true
			});

		case UNSYNTHESIZE_PLAYERS:
			return Object.assign({}, state, {
				didInvalidate: true
			});

		case LOAD_PLAYERS_REQUEST:
			return Object.assign({}, state, {
				fetching: true,
				didInvalidate: true
			});

		case LOAD_PLAYERS_SUCCESS:
			return Object.assign({}, state, {
				fetching: false
			});

		case LOAD_PLAYERS_ERROR:
			return Object.assign({}, state, {
				fetching: false,
				didInvalidate: true
			});

		case RECEIVE_PLAYERS:
			return Object.assign({}, state, {
				fetching: false,
				didInvalidate: false,
				data: players
				// playerLists: returnPlayerLists( action.players )
			});

		case UPDATE_PLAYER_FAVORITED:
			return Object.assign({}, state, {
				data: Object.assign({}, state.data, {
					[id]: Object.assign({}, state.data[id], {
						isFavorited: !state.data[id].isFavorited
					})
				})
			})

		case UPDATE_PLAYER_NOTES:
			return Object.assign({}, state, {
				data: Object.assign({}, state.data, {
					[id]: Object.assign({}, state.data[id], {
						notes
					})
				})
			})

		case UPDATE_ACTIVE_PLAYER:
			return Object.assign({}, state, {
				activePlayerId: id
			});

		case UPDATE_PLAYER_COST:
			return Object.assign({}, state, {
				didInvalidate: true,
				data: Object.assign({}, state.data, {
					[id]: Object.assign({}, state.data[id], {
						cost: cost > 0 ? cost : null
					})
				})
			})

		case UPDATE_PLAYER_OWNER:
			return Object.assign({}, state, {
				didInvalidate: true,
				data: Object.assign({}, state.data, {
					[id]: Object.assign({}, state.data[id], {
						owner: team
					})
				})
			})

		case UPDATE_PLAYER_STAT:
			return Object.assign({}, state, {
				didInvalidate: true,
				data: Object.assign({}, state.data, {
					[id]: Object.assign({}, state.data[id], {
						stats: Object.assign({}, state.data[id].stats, {
							[stat]: Number(value)
						})
					})
				})
			})

		default:
			return state;
	}
}

export default reducer
export {
	LOAD_PLAYERS_REQUEST,
	INVALIDATE_PLAYERS,
	RECEIVE_PLAYERS,
	UPDATE_PLAYER_FAVORITED,
	UPDATE_PLAYER_NOTES,
	UPDATE_ACTIVE_PLAYER,
	UPDATE_PLAYER_COST,
	UPDATE_PLAYER_STAT,
	UPDATE_PLAYER_OWNER
}