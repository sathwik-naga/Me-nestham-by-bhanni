import React from "react";
import { getUniqueOptions } from "../../utils/galleryHelpers";

export { getUniqueOptions };

export default function VariantSelector({
  product,
  selectedOptions = {},
  onOptionSelect
}) {
  if (!product || !product.variants || product.variants.length === 0) {
    return null;
  }

  const uniqueOptions = getUniqueOptions(product);

  const isOptionValueOutOfStock = (optionName, optionValue) => {
    const testOptions = {
      ...selectedOptions,
      [optionName]: optionValue
    };

    const matchingVariant = product.variants.find(v => {
      if (v.optionsMap && Object.keys(v.optionsMap).length > 0) {
        return Object.entries(testOptions).every(
          ([key, value]) => v.optionsMap[key] === value
        );
      }
      if (Array.isArray(v.options) && v.options.length > 0) {
        return Object.entries(testOptions).every(([key, value]) =>
          v.options.some(
            o => (o.option_name || o.name) === key && (o.option_value || o.value) === value
          )
        );
      }
      return v.name === optionValue;
    });

    return !matchingVariant || (matchingVariant.stock !== undefined ? matchingVariant.stock <= 0 : false);
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(uniqueOptions).map(([optionName, optionValues]) => (
        <div key={optionName} className="flex flex-col gap-2">
          <span className="text-xs font-bold text-brand-text uppercase tracking-wider">
            {optionName}: <span className="text-brand-primary font-bold">{selectedOptions[optionName] || optionValues[0]}</span>
          </span>
          <div className="flex flex-wrap gap-2.5">
            {optionValues.map((value) => {
              const isSelected = selectedOptions[optionName] === value;
              const isOutOfStock = isOptionValueOutOfStock(optionName, value);

              return (
                <button
                  key={value}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onOptionSelect(optionName, value)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-brand-primary/10 border-brand-primary text-brand-primary ring-1 ring-brand-primary font-bold shadow-sm"
                      : isOutOfStock
                      ? "border-brand-border bg-gray-100 dark:bg-slate-900 text-brand-text-muted opacity-40 line-through cursor-not-allowed"
                      : "bg-brand-card border-brand-border hover:bg-brand-secondary text-brand-text cursor-pointer"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
