import foodModel from "../models/foodModel.js";
import fs from 'fs'

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({})
        res.json({ success: true, data: foods })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }

}

// add food
const addFood = async (req, res) => {

    try {
        let image_filename = `${req.file.filename}`

        const food = new foodModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category:req.body.category,
            image: image_filename,
        })

        await food.save();
        res.json({ success: true, message: "Food Added" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// delete food
const removeFood = async (req, res) => {
    try {

        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`, () => { })

        await foodModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Food Removed" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }

}
// update food
const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category } = req.body;

        // If image is uploaded, handle it
        let updatedData = { name, description, price, category };
        if (req.file) {
            let image_filename = `${req.file.filename}`;
            updatedData.image = image_filename;

            // delete old image
            const oldFood = await foodModel.findById(id);
            if (oldFood && oldFood.image) {
                fs.unlink(`uploads/${oldFood.image}`, () => {});
            }
        }

        await foodModel.findByIdAndUpdate(id, updatedData, { new: true });
        res.json({ success: true, message: "Food Updated Successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error updating food" });
    }
};


export { listFood, addFood, removeFood, updateFood }