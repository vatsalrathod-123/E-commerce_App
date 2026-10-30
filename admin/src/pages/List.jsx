import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendURL, currency } from "../App";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";

const CATEGORIES = ["Men", "Women", "Kids"];
const SUB_CATEGORIES = ["Topwear", "Bottomwear", "Winterwear"];
const SIZES = ["S", "M", "L", "XL", "XXL"];

// ------------------------ Validation for the edit form ------------------------
const validateEdit = (values) => {
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
  else if (!Number.isInteger(price) || price < 1)
    errors.price = "Price must be a whole number of at least 1";

  if (values.sizes.length === 0) errors.sizes = "Select at least one size";

  return errors;
};

const ErrorText = ({ message }) =>
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

const inputClass = (error) =>
  `w-full px-3 py-2 border rounded ${
    error
      ? "border-red-500 text-red-500 placeholder-red-300"
      : "border-gray-300"
  }`;

const List = ({ token }) => {
  const [list, setlist] = useState([]);

  // Edit popup state
  const [editing, setEditing] = useState(null); // product being edited
  const [editValues, setEditValues] = useState(null);
  const [editSubmitted, setEditSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendURL + "/api/product/list");

      if (response.data.success) {
        setlist(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // The row is removed right away so it can't be clicked again.
  // If the server fails, the row is put back where it was.
  const removeProduct = async (product) => {
    const previousList = list;
    setlist((prev) => prev.filter((item) => item._id !== product._id));

    try {
      const response = await axios.post(
        backendURL + "/api/product/remove",
        { id: product._id },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        setlist(previousList);
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      setlist(previousList);
      toast.error(error.message);
    }
  };

  // ------------------------ Edit ------------------------
  const openEdit = (item) => {
    setEditing(item);
    setEditSubmitted(false);
    setEditValues({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      category: item.category || "Men",
      subCategory: item.subCategory || "Topwear",
      bestseller: item.bestseller === true || item.bestseller === "true",
      sizes: Array.isArray(item.sizes) ? item.sizes : [],
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValues(null);
  };

  const editErrors =
    editSubmitted && editValues ? validateEdit(editValues) : {};

  const toggleEditSize = (size) => {
    setEditValues((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const found = validateEdit(editValues);
    setEditSubmitted(true);
    if (Object.keys(found).length > 0) {
      const firstField = Object.keys(found)[0];
      document.querySelector(`[name="edit-${firstField}"]`)?.focus?.();
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(
        backendURL + "/api/product/update",
        {
          id: editing._id,
          name: editValues.name.trim(),
          description: editValues.description.trim(),
          price: editValues.price,
          category: editValues.category,
          subCategory: editValues.subCategory,
          bestseller: editValues.bestseller,
          sizes: editValues.sizes,
        },
        { headers: { token } },
      );
      if (response.data.success) {
        toast.success(response.data.message);
        closeEdit();
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <p className="mb-2">All Products List</p>
      <div className="flex flex-col gap-2">
        {/* List Table Title */}
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border border-gray-200 bg-gray-100 text-sm">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>

        {/* Product List */}
        {list.map((item) => (
          <div
            className="grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border border-gray-200 text-sm"
            key={item._id}
          >
            <img className="w-12" src={item.image[0]} alt="..." />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <p>
              {currency}
              {item.price}
            </p>
            <div className="flex justify-end md:justify-center gap-2">
              <button
                onClick={() => openEdit(item)}
                className="border border-gray-300 px-3 py-1 text-xs cursor-pointer hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => setPendingDelete(item)}
                className="border border-red-300 text-red-500 px-3 py-1 text-xs cursor-pointer hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------ Edit popup ------------------------ */}
      {editing && editValues && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeEdit}
        >
          <form
            noValidate
            onSubmit={saveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white shadow-xl border-t-4 border-[#c586a5] p-6 flex flex-col gap-3 text-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              Edit product
            </h3>
            <p className="text-xs text-gray-500">
              Images can't be changed here. Delete the product and add it again
              to change images.
            </p>

            <div>
              <p className="mb-1">Product name</p>
              <input
                name="edit-name"
                value={editValues.name}
                onChange={(e) =>
                  setEditValues({ ...editValues, name: e.target.value })
                }
                className={inputClass(editErrors.name)}
                type="text"
              />
              <ErrorText message={editErrors.name} />
            </div>

            <div>
              <p className="mb-1">Product description</p>
              <textarea
                name="edit-description"
                value={editValues.description}
                onChange={(e) =>
                  setEditValues({ ...editValues, description: e.target.value })
                }
                className={inputClass(editErrors.description)}
                rows={3}
              />
              <ErrorText message={editErrors.description} />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <p className="mb-1">Category</p>
                <select
                  value={editValues.category}
                  onChange={(e) =>
                    setEditValues({ ...editValues, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1">Sub category</p>
                <select
                  value={editValues.subCategory}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      subCategory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  {SUB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1">Price</p>
                <input
                  name="edit-price"
                  value={editValues.price}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      price: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  className={`${inputClass(editErrors.price)} sm:w-[120px]`}
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                />
                <ErrorText message={editErrors.price} />
              </div>
            </div>

            <div>
              <p className="mb-1">Sizes</p>
              <div className="flex gap-3">
                {SIZES.map((size) => (
                  <div key={size} onClick={() => toggleEditSize(size)}>
                    <p
                      className={`${
                        editValues.sizes.includes(size)
                          ? "bg-pink-100"
                          : "bg-slate-200"
                      } px-3 py-1 cursor-pointer ${
                        editErrors.sizes ? "ring-1 ring-red-500" : ""
                      }`}
                    >
                      {size}
                    </p>
                  </div>
                ))}
              </div>
              <ErrorText message={editErrors.sizes} />
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                id="edit-bestseller"
                checked={editValues.bestseller}
                onChange={() =>
                  setEditValues({
                    ...editValues,
                    bestseller: !editValues.bestseller,
                  })
                }
              />
              <label htmlFor="edit-bestseller" className="cursor-pointer">
                Add to bestseller
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={closeEdit}
                className="border border-gray-300 text-gray-700 px-5 py-2 cursor-pointer hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-black text-white px-5 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------ Delete confirmation ------------------------ */}
      <ConfirmModal
        open={pendingDelete !== null}
        title="Delete product?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed from the store, including its images.`
            : ""
        }
        confirmText="Yes, delete"
        cancelText="Keep product"
        onConfirm={() => {
          const product = pendingDelete;
          setPendingDelete(null);
          removeProduct(product);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
};

export default List;
