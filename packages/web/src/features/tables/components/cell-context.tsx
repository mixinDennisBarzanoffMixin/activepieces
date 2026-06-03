import { FieldType } from '@activepieces/shared';
import { JSX, createContext, useContext } from 'solid-js';

import { useTableState } from './ap-table-state-provider';

type Cell = {
  rowIdx: number;
  columnIdx: number;
  fieldType: FieldType;
  value: string;
};

type CellContextType = {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleCellChange: (newCellValue: string) => void;
  disabled: boolean;
} & Cell;

const CellContext = createContext<CellContextType>({
  isEditing: false,
  setIsEditing: () => {},
  value: '',
  handleCellChange: () => {},
  rowIdx: 0,
  columnIdx: 0,
  fieldType: FieldType.TEXT,
  disabled: false,
});

type CellProviderProps = Omit<CellContextType, 'value'> & {
  children: JSX.Element;
  containerRef: HTMLDivElement | undefined;
  value: () => string;
};

export const CellProvider = (props: CellProviderProps) => {
  const [updateRecord, fields, records] = useTableState((state) => [
    state.updateRecord,
    state.fields,
    state.records,
  ]);
  const focustContainer = () => {
    // need to refocus container so keyboard navigation between cells works
    // if it was done immediately, the cell would be blurred and call handleRowChange
    requestAnimationFrame(() => {
      props.containerRef?.focus();
    });
  };

  const handleCellChange = (newCellValue: string) => {
    const record = records[props.rowIdx];
    const newRecrodValues = fields.map((_, fIndex) => {
      // values order isn't guaranteed to be the same as fields order
      const fieldValue = record.values.find(
        (value) => value.fieldIndex === fIndex,
      )?.value;
      return {
        fieldIndex: fIndex,
        value: fieldValue ?? '',
      };
    });
    newRecrodValues[props.columnIdx].value = newCellValue;
    updateRecord(props.rowIdx, {
      values: newRecrodValues,
    });
    props.setIsEditing(false);
    focustContainer();
  };
  return (
    <CellContext.Provider
      value={{
        get rowIdx() {
          return props.rowIdx;
        },
        get columnIdx() {
          return props.columnIdx;
        },
        get fieldType() {
          return props.fieldType;
        },
        get value() {
          return props.value();
        },
        get isEditing() {
          return props.isEditing;
        },
        setIsEditing: (value) => {
          props.setIsEditing(value);
          if (!value) {
            focustContainer();
          }
        },
        handleCellChange,
        get disabled() {
          return props.disabled;
        },
      }}
    >
      {props.children}
    </CellContext.Provider>
  );
};

export const useCellContext = () => {
  return useContext(CellContext);
};
