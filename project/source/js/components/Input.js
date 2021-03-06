import React, { Component, PropTypes } from 'react'
import classNames from 'classnames';

import '../../stylesheets/components/input.scss'

class Input extends Component {
	constructor (props) {
		super(props)
		this.state = {
			inputValue: '',
			startValue: '',
			isEditing: false
		}
	}

	shouldComponentUpdate (nextProps, nextState) {
		const showValueStateChanged = nextState.showValue !== this.state.showValue
		return showValueStateChanged || (nextProps.value !== this.props.value) || (nextState.value !== this.state.inputValue)
	}

	componentDidMount() {
		this.setState({inputValue: this.props.value});
		this.allowChange = true
	}

	componentWillReceiveProps (nextProps) {
		this.setState({inputValue: nextProps.value});
	}

	updateInputValue (e) {
		const { valueDidUpdate } = this.props
		const { value } = e.target

		clearTimeout( this.state.keyTimeout )
		this.setState({inputValue: value});

		if (valueDidUpdate) {
			this.setState({
				keyTimeout: setTimeout( () => {
					valueDidUpdate(value)
				}, 200)
			})
		}
	}

	getValue () {
		return this.state.inputValue || this.props.value || 0;
	}

	handleEditStart () {
		if (this.state.isEditing) {
			return;
		}

		this.allowChange = true;

		this.setState({
			isEditing:true,
			startValue: this.getValue()
		})

		if (this.props.didStartEditing) {
			this.props.didStartEditing(this);
		}
	}

	handleKeyPress (e) {
		if (e.key === 'Enter') {
			e.target.blur();
		} else {
			if (this.props.keyWasPressed) {
				this.props.keyWasPressed(e);
			}
		}
	}

	handleBlur (e) {
		this.attemptChangeValue(e)
		if (this.props.handleBlur) {
			this.props.handleBlur(e)
		}
	}

	attemptChangeValue(e) {
		const target = e.nativeEvent.target
		const changeAllowed = this.allowChange
		let value = this.state.inputValue
		if (changeAllowed) {
			this.allowChange = false
			const min = target.getAttribute('min')
			const max = target.getAttribute('max')

			if (value !== '' && (min || max)) {
				value = Number(value)
				if (min && value < min) (value = min)
				if (max && value > max) (value = max)
			}
			if (value != this.state.startValue) {
				this.changeValue(value)
			}
		}

		this.stopEditing()
	}

	changeValue (newValue) {
		this.allowChange = true

		if (this.props.valueDidChange) {
			this.props.valueDidChange(newValue, this);
		}
	}

	startEditing() {
		this.setFocus('in')
		//TO DO: figure out why this.forceEdit exists and see if we can turn this into a state property
		this.forceEdit = true;
	}

	stopEditing() {
		this.setState({isEditing: false})
		if (this.props.didStopEditing) {
			this.props.didStopEditing()
		}
	}

	setFocus (state) {
		if (state === 'in') {
			this.el.focus();
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.isEditing) {
			this.forceEdit = false;
			this.setFocus('in');
		}
	}

	render () {
		return (
			<span className='input'>
				{this.renderValueInput()}
			</span>
		)
	}

	renderValueInput () {
		switch (this.props.type) {
			case 'textarea':
				return this.renderTextArea()
			case 'select':
				return this.renderSelect()
			default:
				return this.renderInput()
		}
	}

	renderInput () {
		const valueExists = this.state.inputValue ? this.state.inputValue.length > 0 : false
		const classes = classNames(this.props.classNames, 'button', 'value-select', {'has-value': valueExists})
		return (
			<input className={classes}
				ref={(ref) => this.el = ref}
				type={this.props.type || 'number'}
				min={this.props.min}
				max={this.props.max}
				step={this.props.step}
				placeholder={this.props.placeholder}
				onClick={this.handleEditStart.bind(this)}
				onFocus={this.handleEditStart.bind(this)}
				onChange={this.updateInputValue.bind(this)}
				onBlur={this.handleBlur.bind(this)}
				onKeyPress={this.handleKeyPress.bind(this)}
				value={this.state.inputValue || ''}>
			</input>
		)
	}

	renderTextArea () {
		const classes = classNames(this.props.classNames, 'value-select', {'has-value': this.state.inputValue.length > 0})
		return (
			<textarea className={classes}
				ref={(ref) => this.el = ref}
				min={this.props.min}
				max={this.props.max}
				placeholder={this.props.placeholder}
				onClick={this.handleEditStart.bind(this)}
				onFocus={this.handleEditStart.bind(this)}
				onChange={this.updateInputValue.bind(this)}
				onBlur={this.handleBlur.bind(this)}
				onKeyPress={this.handleKeyPress.bind(this)}
				value={this.state.inputValue}>
			</textarea>
		)
	}

	renderSelect () {
		const {options} = this.props
		const classes = classNames(this.props.classNames)

		const optionEls = options.map( (option, index) => {
			const value = option.label || option
			return <option key={index} value={value}>{value}</option>	
		})

		return (
			<select className={classes}
				ref={(ref) => this.el = ref}
				onChange={this.updateInputValue.bind(this)}
				value={this.state.inputValue}>
					{optionEls}
			</select>
		)
	}
}

Input.propTypes = {
	value: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	]),
	classNames: PropTypes.string,
	type: PropTypes.string,
	step: PropTypes.number,
	min: PropTypes.number,
	max: PropTypes.number,
	placeholder: PropTypes.string,
	options: PropTypes.array,
	didStartEditing: PropTypes.func,
	didStopEditing: PropTypes.func,
	valueDidChange: PropTypes.func,
	valueDidUpdate: PropTypes.func,
	keyWasPressed: PropTypes.func
}

export default Input;
