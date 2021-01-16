import React, {
	useEffect,
	useState,
	useCallback,
	useLayoutEffect,
	useRef,
	useMemo,
} from 'react';

import PopperContainer from './../../containers/PopperContainer';

import { SketchPicker } from 'react-color';

const NUM_SWATCHES = 6;

const generateColorList = (colorList) => {
	return () => {
		let newColorList = [];
		for (let i = 0; i < NUM_SWATCHES; i++) {
			if (colorList[i]) {
				newColorList.push(colorList[i]);
			} else {
				newColorList.push(`##EMPTY-${i}`);
			}
		}
		return newColorList;
	};
};

const ColorPickerPopper = ({
	referenceElement,
	closeFn,
	colorObj,
	setColorObj,
	setColorFn,
}) => {
	// STATE
	const [pickerColor, setPickerColor] = useState(colorObj.color);
	const [showMoreColors, setShowMoreColors] = useState(false);

	// MEMO
	const defaultColorList = useMemo(generateColorList(colorObj.defaultColorList), [
		colorObj.defaultColorList,
	]);
	const userColorList = useMemo(generateColorList(colorObj.userColorList), [
		colorObj.userColorList,
	]);

	// REF
	const forceUpdateRef = useRef(null);

	const updateColor = useCallback(
		(e, color) => {
			if (color.slice(0, 7) === '##EMPTY') {
				return;
			}
			setColorFn(e, color);
			setPickerColor(color);
		},
		[setColorFn]
	);

	const wrappedCloseFn = (color = pickerColor) => {
		setColorObj((prev) => {
			if (color.slice(0, 7) === '##EMPTY') {
				return prev;
			}

			// If in the defaultColorList, update active color if needed
			if (prev.defaultColorList.includes(color)) {
				if (prev.color === color) {
					return prev;
				} else {
					return {
						...prev,
						color,
					};
				}
			}

			// If already in the list, remove before adding to front
			let newColorList = [...prev.userColorList];
			const colorIndex = newColorList.findIndex((item) => item === color);
			if (colorIndex !== -1) {
				newColorList.splice(colorIndex, 1);
			}

			// Add the color to the front and return.
			newColorList.unshift(color);

			return {
				...prev,
				color,
				userColorList: newColorList.slice(0, NUM_SWATCHES), // Cap the number of colors
			};
		});

		closeFn();
	};

	// Recenter the popper when changing views
	useLayoutEffect(() => {
		if (forceUpdateRef.current) {
			forceUpdateRef.current();
		}
	}, [showMoreColors]);

	return (
		<PopperContainer
			referenceElement={referenceElement}
			closeFn={wrappedCloseFn}
			forceUpdateRef={forceUpdateRef}>
			<div className='accent-color-swatch-picker'>
				{!showMoreColors && (
					// DEFAULT COLORS
					<div className='color-picker-popper-swatch-section'>
						<div
							className='color-picker-popper-swatch-row'
							style={{ paddingBottom: '0.4rem' }}>
							{defaultColorList.map((item) => (
								<div
									key={item}
									className={
										'color-picker-popper-swatch ' +
										(item.slice(0, 7) === '##EMPTY' ? 'empty' : '')
									}
									style={{ backgroundColor: item }}
									onClick={(e) => {
										updateColor(e, item);
									}}
								/>
							))}
						</div>
						{/* USER COLORS */}
						{/* When selecting, move to front of list */}
						<div className='color-picker-popper-swatch-row' style={{ paddingTop: '0' }}>
							{userColorList.map((item) => (
								<div
									key={item}
									className={
										'color-picker-popper-swatch ' +
										(item.slice(0, 7) === '##EMPTY' ? 'empty' : '')
									}
									style={{ backgroundColor: item }}
									onClick={(e) => {
										updateColor(e, item);
									}}
								/>
							))}
						</div>
						{/* MORE & AUTO */}
						<div className='color-picker-popper-button-row'>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									setShowMoreColors(true);
								}}
								style={{ marginRight: '0.3rem' }}>
								More
							</button>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									setColorFn(e, '', 'REMOVE');
								}}
								style={{ marginLeft: '0.3rem' }}>
								Auto
							</button>
						</div>
					</div>
				)}
				{showMoreColors && (
					<div className='sketch-picker-wrapper'>
						<SketchPicker
							disableAlpha={true}
							color={pickerColor}
							width={160}
							onChange={(color) => setPickerColor(color.hex)}
							// onChangeComplete={handleChangeComplete}
							presetColors={[]}
						/>
						<div className='color-picker-popper-button-row sketch-picker'>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									setShowMoreColors(false);
								}}
								style={{ marginRight: '0.3rem' }}>
								Back
							</button>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									updateColor(e, pickerColor);
									setTimeout(() => wrappedCloseFn(pickerColor), 0); // Timeout needed to let the editorState resolve
								}}
								style={{ marginLeft: '0.3rem' }}>
								Select
							</button>
						</div>
					</div>
				)}
			</div>
		</PopperContainer>
	);
};

export default ColorPickerPopper;
