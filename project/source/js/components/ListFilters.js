import React, { Component, PropTypes } from 'react'
import classNames from 'classnames';

import Input from './Input.js'

import '../../stylesheets/components/list-filters.scss'

class ListFilters extends Component {
	constructor(props) {
		super(props)
		this.state = {
			searchValue: null
		}
	}

	setSearchQuery (searchValue) {
		this.setState({searchValue});

		if (this.props.setSearchQuery) {
			this.props.setSearchQuery(searchValue);
		}
	}

	filterSelected (property, id) {
		if (this.props.filterSelected) {
			this.props.filterSelected(property, id)
		}
	}

	getSearchValue () {
		return this.state.searchValue;
	}

	getFilterButtons () {
		const { tableRef, filters, activeFilter } = this.props
		const filterButtons = filters.filter( filter => filter.label )

		return filterButtons.map( (filter, index) => {
			const { column, label, heading } = filter
			const filterFunction = () => this.filterSelected(column, label)
			const classes = classNames('list-filter', column, {active: activeFilter === label})

			return (
				<button
					className={classes}
					key={index}
					onClick={filterFunction} >
						{heading || label}
				</button>
			)
		})
	}

	render () {

		return (
			<div className='list-filters'>
				<Input
					classNames='list-filter'
					type='text'
					placeholder='Search'
					value= {this.getSearchValue()}
					valueDidUpdate={this.setSearchQuery.bind(this)} />

				{this.getFilterButtons()}

			</div>
		)
	}
}

ListFilters.propTypes = {
	activeFilter: PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.array
	]),
	searchQuery: PropTypes.string,
	setSearchQuery: PropTypes.func,
	filterSelected: PropTypes.func,
	filters: PropTypes.array.isRequired
}

export default ListFilters;
