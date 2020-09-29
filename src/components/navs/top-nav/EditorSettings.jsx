import React, {
	useEffect,
	useState,
	useContext,
	useLayoutEffect,
	useRef,
	useCallback,
} from 'react';

import { SettingsContext } from '../../../contexts/settingsContext';

import PopperContainer from '../../containers/PopperContainer';
import ResizableWindow from '../../containers/ResizableWindow';

import { SketchPicker, ChromePicker } from 'react-color';
import ResetSVG from '../../../assets/svg/ResetSVG';

const EditorSettings = () => {
	// CONTEXT
	const {
		editorSettings,
		setEditorSettings,
		setShowEditorSettings,
		editorContainerRef,
		editorPaddingWrapperRef,
		defaultSettings,
	} = useContext(SettingsContext);

	// STATE
	const [editorPadding, setEditorPadding] = useState(editorSettings.editorPadding);
	const [editorMaxWidth, setEditorMaxWidth] = useState(editorSettings.editorMaxWidth);
	const [showAccentPicker, setShowAccentPicker] = useState(false);
	const [primaryColor, setPrimaryColor] = useState('');

	// REFS
	const colorSwatchRef = useRef(null);

	// UPDATE
	const closeFn = useCallback(() => {
		// Check if we should add the new primaryColor to the primaryColorList
		let primaryColorList = [...editorSettings.primaryColorList];
		let colorListIndex = primaryColorList.findIndex(
			(item) => item === primaryColor.toUpperCase()
		);

		// If the color is NOT in the list, add it to the front.
		if (colorListIndex === -1) {
			primaryColorList.unshift(primaryColor.toUpperCase());
			while (primaryColorList.length > 6) {
				primaryColorList.pop();
			}
		}

		// We want the color to be first in the list. > 0 is after first.
		if (colorListIndex > 0) {
			primaryColorList.splice(colorListIndex, 1);
			primaryColorList.unshift(primaryColor.toUpperCase());
		}

		// If we made changes, save those chnages to the color list
		if (colorListIndex !== 0) {
			setEditorSettings({
				...editorSettings,
				primaryColorList,
			});
		}

		// Close the settings window
		setShowEditorSettings(false);
	}, [editorSettings, primaryColor]);

	useEffect(() => {
		let newPrimary = getComputedStyle(document.querySelector(':root')).getPropertyValue(
			'--color-primary'
		); // #999999

		setPrimaryColor(newPrimary);
	}, []);

	// Editor Padding Change
	const handlePaddingChange = (e) => {
		editorPaddingWrapperRef.current.style.padding = `0 ${e.target.value}rem`;
		setEditorPadding(e.target.value);
	};

	// Editor Padding Mouse Up
	const handlePaddingMouseUp = (e) => {
		setEditorPadding(e.target.value);
		setEditorSettings({
			...editorSettings,
			editorPadding: e.target.value,
		});
	};

	// Editor Max Width Change
	const handleMaxWidthChange = (e) => {
		editorContainerRef.current.style.maxWidth = `${e.target.value}rem`;
		setEditorMaxWidth(e.target.value);
	};

	// Editor Max Width Mouse Up
	const handleMaxWidthMouseUp = (e) => {
		setEditorMaxWidth(e.target.value);
		setEditorSettings({
			...editorSettings,
			editorMaxWidth: e.target.value,
		});
	};

	// Reset to default on double click
	const handleDoubleClick = (propName) => {
		setEditorSettings({
			...editorSettings,
			[propName]: defaultSettings[propName],
		});

		// Set the local state
		switch (propName) {
			case 'editorPadding':
				setEditorPadding(defaultSettings[propName]);
				break;
			case 'editorMaxWidth':
				setEditorMaxWidth(defaultSettings[propName]);
				break;
			default:
		}
	};

	const handlePrimaryColorChange = (color) => {
		const rootElement = document.querySelector(':root');
		rootElement.style.setProperty('--color-primary', color.hex);

		let newRgb = color.rgb ? color.rgb : `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`;
		rootElement.style.setProperty('--color-primary-rgb', newRgb);
		setPrimaryColor(color.hex);
	};

	return (
		<>
			<ResizableWindow windowTitle='Editor Settings' closeFn={closeFn} defaultWidth={350}>
				<div className='editor-settings-wrapper'>
					{/* EDITOR PADDING */}
					<p className='settings-category-title'>Page Margin</p>
					<div className='settings-range-slider-wrapper'>
						<input
							className='settings-range-slider'
							type='range'
							value={editorPadding}
							min='0.0'
							max='10.0'
							step='0.1'
							onChange={handlePaddingChange}
							onMouseUp={handlePaddingMouseUp}
							onDoubleClick={() => handleDoubleClick('editorPadding')}
						/>
						<input
							className='settings-range-number-input'
							type='number'
							value={editorPadding}
							onChange={handlePaddingMouseUp}
						/>
					</div>

					{/* EDITOR MAX WIDTH */}
					<p className='settings-category-title'>Page Width</p>
					<div className='settings-range-slider-wrapper'>
						<input
							className='settings-range-slider'
							type='range'
							value={editorMaxWidth}
							min='0.0'
							max='120.0'
							step='0.1'
							onChange={handleMaxWidthChange}
							onMouseUp={handleMaxWidthMouseUp}
							onDoubleClick={() => handleDoubleClick('editorMaxWidth')}
						/>
						<input
							className='settings-range-number-input'
							type='number'
							value={editorMaxWidth}
							onChange={handleMaxWidthMouseUp}
						/>
					</div>

					<p className='settings-category-title'>Accent color</p>
					<div className='accent-color-swatch-row'>
						<div
							ref={colorSwatchRef}
							className='accent-color-swatch'
							onClick={() => setShowAccentPicker(true)}
						/>
						<button
							className='editor-settings-reset'
							onClick={() => {
								setEditorSettings({
									...editorSettings,
									primaryColor: defaultSettings.primaryColor,
									primaryColorRgb: defaultSettings.primaryColorRgb,
								});
								handlePrimaryColorChange({
									hex: defaultSettings.primaryColor,
									rgb: defaultSettings.primaryColorRgb,
								});
							}}>
							<ResetSVG />
						</button>
					</div>
					{showAccentPicker && (
						<PopperContainer
							referenceElement={colorSwatchRef.current}
							closeFn={() => setShowAccentPicker(false)}>
							<div className='accent-color-swatch-picker'>
								<SketchPicker
									disableAlpha={true}
									color={primaryColor}
									width={160}
									onChange={handlePrimaryColorChange}
									onChangeComplete={(color) => {
										setEditorSettings({
											...editorSettings,
											primaryColor: color.hex,
											primaryColorRgb: `${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}`,
										});
									}}
									presetColors={editorSettings.primaryColorList}
								/>
							</div>
						</PopperContainer>
					)}

					<p className='settings-category-title'>Default font</p>
					<p className='settings-category-title'>Default font size</p>
					<p className='settings-category-title'>Default line spacing</p>
					<ul>
						<li>Requires project level settings</li>
					</ul>
				</div>
			</ResizableWindow>
		</>
	);
};

export default EditorSettings;
