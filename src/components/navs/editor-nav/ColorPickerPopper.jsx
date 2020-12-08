import React from 'react';

const ColorPickerPopper = ({ referenceElement, closeFn }) => {
	return (
		<PopperContainer referenceElement={referenceElement} closeFn={closeFn}>
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
	);
};

export default ColorPickerPopper;
