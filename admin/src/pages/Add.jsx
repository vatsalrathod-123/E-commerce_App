import { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendURL } from "../App";
import { toast } from "react-toastify";

// ------------------------ Validation ------------------------
const validate = (values) => {
  const errors = {};
  const name = values.name.trim();
  const description = values.description.trim();
  const price = Number(values.price);

  if (!name) errors.name = "Product name is required";
  else if (name.length < 3)
    errors.name = "Product name must be at least 3 characters";

  if (!description) errors.description = "Product description is required";
  else if (description.length < 10)
    errors.description = "Description must be at least 10 characters";

  if (values.price === "" || values.price === null)
    errors.price = "Product price is required";
  else if (!Number.isFinite(price) || price < 1)
    errors.price = "Price must be at least 1";

  if (values.sizes.length === 0) errors.sizes = "Select at least one size";

  if (!values.image1 && !values.image2 && !values.image3 && !values.image4)
    errors.images = "Upload at least one image";

  return errors;
};

// ------------------------ Reusable red-error text ------------------------
const ErrorText = ({ message }) =>
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

const inputClass = (error) =>
  `w-full px-3 py-2 border rounded ${
    error
      ? "border-red-500 text-red-500 placeholder-red-300"
      : "border-gray-300"
  }`;

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  // Errors show only after the first submit, then update as the user types
  const [submitted, setSubmitted] = useState(false);

  const values = {
    name,
    description,
    price,
    sizes,
    image1,
    image2,
    image3,
    image4,
  };
  const errors = submitted ? validate(values) : {};

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const found = validate(values);
    setSubmitted(true);
    if (Object.keys(found).length > 0) {
      const firstField = Object.keys(found)[0];
      const target =
        firstField === "images"
          ? document.getElementById("image1")
          : document.querySelector(`[name="${firstField}"]`);
      target?.focus?.();
      return;
    }

    try {
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(
        backendURL + "/api/product/add",
        formData,
        { headers: { token } },
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setName("");
        setDescription("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice("");
        setSubmitted(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const toggleSize = (size) => {
    setSizes((prev) =>
      prev.includes(size)
        ? prev.filter((item) => item !== size)
        : [...prev, size],
    );
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      noValidate
      className="flex flex-col w-full items-start gap-3"
    >
      <div>
        <p className="mb-2">Upload Image</p>
        <div className="flex gap-2">
          <label htmlFor="image1">
            <img
              className="w-20"
              src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
              alt="..."
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id="image1"
              accept="image/*"
              hidden
            />
          </label>
          <label htmlFor="image2">
            <img
              className="w-20"
              src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
              alt="..."
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id="image2"
              accept="image/*"
              hidden
            />
          </label>
          <label htmlFor="image3">
            <img
              className="w-20"
              src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
              alt="..."
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id="image3"
              accept="image/*"
              hidden
            />
          </label>
          <label htmlFor="image4">
            <img
              className="w-20"
              src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
              alt="..."
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id="image4"
              accept="image/*"
              hidden
            />
          </label>
        </div>
        <ErrorText message={errors.images} />
      </div>

      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input
          name="name"
          onChange={(e) => setName(e.target.value)}
          value={name}
          className={`${inputClass(errors.name)} max-w-[500px]`}
          type="text"
          placeholder="Type here"
        />
        <ErrorText message={errors.name} />
      </div>

      <div className="w-full">
        <p className="mb-2">Product description </p>
        <textarea
          name="description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className={`${inputClass(errors.description)} max-w-[500px]`}
          placeholder="Write content here..."
        />
        <ErrorText message={errors.description} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8 ">
        <div>
          <p className="mb-2">Product category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2"
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Sub category</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-3 py-2"
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className="mb-2">Product Price</p>
          <input
            name="price"
            onChange={(e) =>
              setPrice(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            value={price}
            className={`${inputClass(errors.price)} sm:w-[120px]`}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="25"
          />
          <ErrorText message={errors.price} />
        </div>
      </div>

      <div>
        <p className="mb-2"> Product Sizes </p>
        <div className="flex gap-3">
          {["S", "M", "L", "XL", "XXL"].map((size) => (
            <div key={size} onClick={() => toggleSize(size)}>
              <p
                className={`${
                  sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"
                } px-3 py-1 cursor-pointer ${
                  errors.sizes ? "ring-1 ring-red-500" : ""
                }`}
              >
                {size}
              </p>
            </div>
          ))}
        </div>
        <ErrorText message={errors.sizes} />
      </div>

      <div className="flex gap-2 mt-2">
        <input
          onChange={() => setBestseller((prev) => !prev)}
          checked={bestseller}
          type="checkbox"
          id="bestseller"
        />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>

      <button
        type="submit"
        className="w-28 py-3 mt-4 bg-black text-white cursor-pointer"
      >
        ADD
      </button>
    </form>
  );
};

export default Add;
