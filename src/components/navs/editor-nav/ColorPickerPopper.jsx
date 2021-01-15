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
				newColorList.push('##EMPTY');
			}
		}
		return newColorList;
	};
};

const ColorPickerPopper = ({ referenceElement, closeFn, colorObj, setColorObj }) => {
	const [pickerColor, setPickerColor] = useState(colorObj.color);
	const [showMoreColors, setShowMoreColors] = useState(false);

	const defaultColorList = useMemo(generateColorList(colorObj.defaultColorList), [
		colorObj.defaultColorList,
	]);
	const userColorList = useMemo(generateColorList(colorObj.userColorList), [
		colorObj.userColorList,
	]);

	const forceUpdateRef = useRef(null);

	const wrappedCloseFn = useCallback(
		(color) => {
			// setColorObj((prev) => {
			// 	// If already the first color, no change.
			// 	if (prev.defaultColorList[0] === color) {
			// 		console.log('just returning prev');
			// 		return prev;
			// 	}

			// 	// If already in the list, move to the front.
			// 	let newColorList = [...prev.defaultColorList];
			// 	let colorIndex = newColorList.findIndex((item) => item === color);
			// 	if (colorIndex !== -1) {
			// 		newColorList.splice(colorIndex, 1);
			// 		console.log('splicing from middle of list');
			// 	} else {
			// 		// Otherwise, remove one from the end.
			// 		newColorList.pop();
			// 		console.log('removing one from end of list');
			// 	}

			// 	// Add the color to the front and return.
			// 	newColorList.unshift(color);
			// 	console.log("new object we're setting: ", {
			// 		color: color,
			// 		defaultColorList: newColorList,
			// 	});
			// 	return {
			// 		// ...prev,
			// 		color: color,
			// 		defaultColorList: newColorList,
			// 	};
			// });

			closeFn();
		},
		[closeFn]
	);

	// Recenter the popper when changing views
	useLayoutEffect(() => {
		if (forceUpdateRef.current) {
			forceUpdateRef.current();
		}
	}, [showMoreColors]);

	return (
		<PopperContainer
			referenceElement={referenceElement}
			closeFn={() => wrappedCloseFn(pickerColor)}
			forceUpdateRef={forceUpdateRef}>
			<div className='accent-color-swatch-picker'>
				{!showMoreColors && (
					<div className='color-picker-popper-swatch-section'>
						<div className='color-picker-popper-swatch-row'>
							{defaultColorList.map((item) => (
								<div
									className={
										'color-picker-popper-swatch ' + (item === '##EMPTY' ? 'empty' : '')
									}
									style={{ backgroundColor: item }}
								/>
							))}
						</div>
						<div className='color-picker-popper-swatch-row'>
							{userColorList.map((item) => (
								<div
									className={
										'color-picker-popper-swatch ' + (item === '##EMPTY' ? 'empty' : '')
									}
									style={{ backgroundColor: item }}
								/>
							))}
						</div>
						<div className='color-picker-popper-button-row'>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									setShowMoreColors(true);
								}}>
								More
							</button>
							<button
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => {
									e.stopPropagation();
									setShowMoreColors(true);
								}}>
								Auto
							</button>
						</div>
					</div>
				)}
				{showMoreColors && (
					<SketchPicker
						disableAlpha={true}
						color={pickerColor}
						width={160}
						onChange={(color) => setPickerColor(color.hex)}
						// onChangeComplete={handleChangeComplete}
						presetColors={colorObj.defaultColorList}
					/>
				)}
			</div>
		</PopperContainer>
	);
};

export default ColorPickerPopper;
