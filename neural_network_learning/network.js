const tf = require('@tensorflow/tfjs')
const fs = require('fs')
const parse = require('./parse_db')
const npy = require('tfjs-npy')
require('@tensorflow/tfjs-node');

function createModel() {
  const model = tf.sequential(); 
  
  model.add(tf.layers.dense({inputShape: [4], units: 3, activation: "softmax"}));
  model.add(tf.layers.dense({units: 2, activation: "softmax"}));

  return model;
}

function convertToTensor(data) {
	
  return tf.tidy(() => {
    tf.util.shuffle(data);

    const inputs = data.map(d => [d.length, d.varDec, d.callExp, d.assignExp]) //[d.varDec, d.callExp, d.assignExp, d.literal]) //
	//console.log(inputs);
    const labels = data.map(d => tf.oneHot(d.type - 1, 2).dataSync());
	//console.log(labels);
	

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 4]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 2]);

    const max = inputTensor.max();
    const min = inputTensor.min(); 

    const normalized = inputTensor.sub(min).div(max.sub(min));

    return {
      inputs: normalized,
      labels: labelTensor,
      max,
      min
    }
  });  
}

async function trainModel(model, inputs, labels) {
  // Prepare the model for training.  
  model.compile({
    optimizer: tf.train.adam(0.05),
    loss: "categoricalCrossentropy",
    metrics: ['accuracy'],
  });
  
  const batchSize = 32;
  const epochs = 50;
  
  return await model.fit(inputs, labels, {
	  batchSize,
    epochs: epochs,
    shuffle: true,
    callbacks: {
		onEpochEnd: async (epoch, logs) => {
			console.log("(" + epoch + ", " + logs.acc + ") ");
		}
	}
  });
}


(async() => {
	data = parse.prepareData();
	const model = createModel(); 
	const tensorData = convertToTensor(data);
	const {inputs, labels, inputMax, inputMin} = tensorData;
	
	fs.writeFile('inputMax.json', JSON.stringify(inputMax.arraySync()), function (err) {
					  if (err) return console.log(err);
					})
	fs.writeFile('inputMin.json', JSON.stringify(inputMin.arraySync()), function (err) {
					  if (err) return console.log(err);
					})
	
	await trainModel(model, inputs, labels);
	console.log('Done Training');
	
	await model.save('file:///generated_model');

})();