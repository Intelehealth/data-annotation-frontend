export interface AnnotationField {
  csvColumnName: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'markdown' | 'image' | 'audio';
  isRequired: boolean;
  // true if it needs annotation (right panel); false if metadata (left)
  isAnnotationField: boolean;
  // optional: whether this field is the unique primary key
  isPrimaryKey?: boolean;
  // whether this field should be visible in the annotation interface
  isVisible?: boolean;
  options?: string[];
  instructions?: string;
  isNewColumn?: boolean; // true if this is a new column, not from CSV  
  newColumnId?: string; // Reference to NewColumn if isNewColumn is true
}

export interface AnnotationConfig {
  _id: string;
  csvImportId: string; // Not used in dataset-level annotation but kept for compatibility
  userId?: string;
  annotationFields: AnnotationField[];
  annotationLabels?: any[]; // Add annotation labels
  rowAnnotations: any[];
  totalRows: number;
  completedRows: number;
  lastViewedRow?: number; // Track last viewed row for resume
  status: string;
  createdAt: string;
  updatedAt: string;
}
