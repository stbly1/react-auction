import React, {Component, PropTypes} from 'react'
import classNames from 'classnames';
import InputToggle from './InputToggle'

class InputPlayerStat extends Component {

	constructor (props) {
		super(props)
		this.state = {
			searchValue: null
		}
	}

	shouldComponentUpdate (nextProps) {
		// console.log('should component update?', nextProps.value !== this.props.value)
		return nextProps.value !== this.props.value
	}

	onStatChange (value) {
		const { category, onStatChange } = this.props
		if (onStatChange) {
			return onStatChange(value)
		}
	}

	render () {
		// console.log('component does update')
		const { category, value, isRatio } = this.props
		const decimalPlaces = isRatio ? 3 : 0;
		const increment = isRatio ? 0.001 : 1;
		const max = isRatio ? 1 : 999;
		const inputValue = Number(value || 0).toFixed(decimalPlaces);

		return (
			<InputToggle
				value={inputValue}
				step={increment}
				max={max || 1000}
				min={0}
				valueDidChange={this.onStatChange.bind(this)} />
		)
	}
}

InputPlayerStat.propTypes = {
	category: PropTypes.string.isRequired,
	value: PropTypes.number.isRequired,
	onStatChange: PropTypes.func,
	isRatio: PropTypes.bool,
}

export default InputPlayerStat;