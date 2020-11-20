import React, { PureComponent } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import FormSubmitButton from '../_buttons/FormSubmitButton';

export default class ProfileImageForm extends PureComponent {
	// The structure of this component is mimicing the demo provided at:
	//   https://github.com/DominicTobias/react-image-crop.

	// TO-DO: Save full size crop in addition to maxImageWidth version

	// REQUIRES handleSubmit(fileUrl)

	// Used by ReactCrop for for the cropped image details
	state = {
		src: null,
		crop: {
			unit: '%',
			width: 75,
			x: 12.5,
			y: 12.5,
			aspect: 1 / 1,
		},
	};

	// Caps the image size. Assumes all images are square.
	maxImageWidth = 320;

	// Loads the file into memory, stores it in state
	onSelectFile = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			const reader = new FileReader();
			reader.addEventListener('load', () => this.setState({ src: reader.result }));
			reader.readAsDataURL(e.target.files[0]);
		}
	};

	// If you setState the crop in here you should return false.
	onImageLoaded = (image) => {
		this.imageRef = image;
	};

	onCropComplete = (crop) => {
		this.makeClientCrop(crop);
	};

	onCropChange = (crop, percentCrop) => {
		// You could also use percentCrop:
		// this.setState({ crop: percentCrop });
		this.setState({ crop });
	};

	// Crops the image, then saves the URL into state
	async makeClientCrop(crop) {
		if (this.imageRef && crop.width && crop.height) {
			const croppedImageUrl = await this.getCroppedImg(this.imageRef, crop, 'newFile.jpeg');
			this.setState({ croppedImageUrl });
		}
	}

	// Uses Canvas to crop and compress the image
	getCroppedImg(image, crop, fileName) {
		const canvas = document.createElement('canvas');
		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;

		// Sets the new canvas to be the same size as the cropped image
		canvas.width = Math.min(Math.ceil(crop.width * scaleX), this.maxImageWidth);
		canvas.height = Math.min(Math.ceil(crop.height * scaleY), this.maxImageWidth);

		const ctx = canvas.getContext('2d');

		// Loads the image in the cavas
		// Arguments: (image, crop x coord., crop y coord., full width, full height,
		//    canvas x coord., canvas y coord., image width, image height)
		ctx.drawImage(
			image,
			crop.x * scaleX,
			crop.y * scaleY,
			crop.width * scaleX,
			crop.height * scaleY,
			0,
			0,
			Math.min(crop.width * scaleX, this.maxImageWidth),
			Math.min(crop.height * scaleY, this.maxImageWidth)
		);

		// Converts the image to a blob, compresses, saves the URL
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						//reject(new Error('Canvas is empty'));
						console.error('Canvas is empty');
						return;
					}
					// blob.name = fileName;
					window.URL.revokeObjectURL(this.fileUrl);
					this.fileUrl = window.URL.createObjectURL(blob);
					// resolve(this.fileUrl);
					resolve(blob);
				},
				'image/jpeg',
				0.92
			);
		});
	}

	render() {
		const { crop, croppedImageUrl, src } = this.state;

		return (
			<>
				<h2>Upload New Image</h2>
				<hr className='modal-form-hr' />
				{/* Hides input (upload) button, styles label as the button */}
				<div>
					<input
						type='file'
						name='file'
						id='file-upload-input'
						className='hide-input-button'
						accept='image/*'
						onChange={this.onSelectFile}
					/>
					<label htmlFor='file-upload-input'>Choose a file</label>
				</div>
				<br />

				{/* Uploaded image with crop option */}
				{src && (
					<div className={'profile-img-upload-react-crop-wrapper'}>
						<ReactCrop
							className={'profile-img-upload-react-crop'}
							src={src}
							crop={crop}
							ruleOfThirds
							circularCrop
							onImageLoaded={this.onImageLoaded}
							onComplete={this.onCropComplete}
							onChange={this.onCropChange}
						/>
					</div>
				)}

				{/* Submit */}
				{src && (
					<form onSubmit={(e) => this.props.handleSubmit(e, croppedImageUrl)}>
						<FormSubmitButton
							formSubmitted={false}
							loading={this.props.submissionLoading}
							serverError={this.props.serverError}
							message={'Submission complete!'}
							buttonText={'Submit'}
						/>
					</form>
				)}
			</>
		);
	}
}
