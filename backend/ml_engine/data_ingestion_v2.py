"""
Enterprise Data Ingestion Engine
Provides explicit processing depth per file type with validation and logging
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import pandas as pd
import json
import logging

class ProcessingLevel(Enum):
    FULL_ML_PIPELINE = "full_ml_pipeline"
    SCHEMA_EXTRACTION = "schema_extraction" 
    METADATA_ONLY = "metadata_only"
    UNSUPPORTED = "unsupported"

class FileType(Enum):
    CSV = "csv"
    XLSX = "xlsx"
    JSON = "json"
    PDF = "pdf"
    DOCX = "docx"
    UNKNOWN = "unknown"

@dataclass
class IngestionResult:
    file_type: FileType
    processing_level: ProcessingLevel
    dataframe: Optional[pd.DataFrame]
    schema: Dict[str, Any]
    metadata: Dict[str, Any]
    validation_errors: List[str]
    processing_notes: List[str]

class DataIngestionEngine:
    """
    Industry-grade data ingestion with explicit processing capabilities
    """
    
    PROCESSING_MATRIX = {
        FileType.CSV: ProcessingLevel.FULL_ML_PIPELINE,
        FileType.XLSX: ProcessingLevel.FULL_ML_PIPELINE,
        FileType.JSON: ProcessingLevel.SCHEMA_EXTRACTION,
        FileType.PDF: ProcessingLevel.METADATA_ONLY,
        FileType.DOCX: ProcessingLevel.METADATA_ONLY,
        FileType.UNKNOWN: ProcessingLevel.UNSUPPORTED
    }
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def ingest_file(self, filepath: str) -> IngestionResult:
        """
        Process file according to its type and capabilities
        """
        file_type = self._detect_file_type(filepath)
        processing_level = self.PROCESSING_MATRIX[file_type]
        
        self.logger.info(f"Processing {filepath} as {file_type.value} with {processing_level.value}")
        
        if processing_level == ProcessingLevel.FULL_ML_PIPELINE:
            return self._process_ml_ready(filepath, file_type)
        elif processing_level == ProcessingLevel.SCHEMA_EXTRACTION:
            return self._extract_schema(filepath, file_type)
        elif processing_level == ProcessingLevel.METADATA_ONLY:
            return self._extract_metadata(filepath, file_type)
        else:
            return self._unsupported_file(filepath, file_type)
    
    def _detect_file_type(self, filepath: str) -> FileType:
        """Detect file type from extension"""
        extension = filepath.lower().split('.')[-1]
        type_map = {
            'csv': FileType.CSV,
            'xlsx': FileType.XLSX,
            'xls': FileType.XLSX,
            'json': FileType.JSON,
            'pdf': FileType.PDF,
            'docx': FileType.DOCX
        }
        return type_map.get(extension, FileType.UNKNOWN)
    
    def _process_ml_ready(self, filepath: str, file_type: FileType) -> IngestionResult:
        """Full ML pipeline processing for CSV/XLSX"""
        try:
            if file_type == FileType.CSV:
                df = pd.read_csv(filepath)
            else:  # XLSX
                df = pd.read_excel(filepath)
            
            schema = self._infer_schema(df)
            metadata = self._extract_basic_metadata(df, filepath)
            validation_errors = self._validate_ml_readiness(df)
            
            return IngestionResult(
                file_type=file_type,
                processing_level=ProcessingLevel.FULL_ML_PIPELINE,
                dataframe=df,
                schema=schema,
                metadata=metadata,
                validation_errors=validation_errors,
                processing_notes=["Ready for ML training pipeline"]
            )
        except Exception as e:
            return IngestionResult(
                file_type=file_type,
                processing_level=ProcessingLevel.UNSUPPORTED,
                dataframe=None,
                schema={},
                metadata={},
                validation_errors=[f"Processing failed: {str(e)}"],
                processing_notes=[]
            )
    
    def _extract_schema(self, filepath: str, file_type: FileType) -> IngestionResult:
        """Schema extraction for JSON files"""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            schema = self._infer_json_schema(data)
            metadata = {"file_size": len(str(data)), "structure": type(data).__name__}
            
            # Try to convert to DataFrame if possible
            df = None
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                try:
                    df = pd.DataFrame(data)
                except:
                    pass
            
            return IngestionResult(
                file_type=file_type,
                processing_level=ProcessingLevel.SCHEMA_EXTRACTION,
                dataframe=df,
                schema=schema,
                metadata=metadata,
                validation_errors=[],
                processing_notes=["Schema extracted, limited ML capabilities"]
            )
        except Exception as e:
            return self._unsupported_file(filepath, file_type, str(e))
    
    def _extract_metadata(self, filepath: str, file_type: FileType) -> IngestionResult:
        """Metadata extraction for PDF/DOCX"""
        import os
        metadata = {
            "file_size": os.path.getsize(filepath),
            "file_name": os.path.basename(filepath)
        }
        
        return IngestionResult(
            file_type=file_type,
            processing_level=ProcessingLevel.METADATA_ONLY,
            dataframe=None,
            schema={},
            metadata=metadata,
            validation_errors=[],
            processing_notes=["Metadata only, no ML capabilities"]
        )
    
    def _unsupported_file(self, filepath: str, file_type: FileType, error: str = "") -> IngestionResult:
        """Handle unsupported files"""
        return IngestionResult(
            file_type=file_type,
            processing_level=ProcessingLevel.UNSUPPORTED,
            dataframe=None,
            schema={},
            metadata={},
            validation_errors=[f"Unsupported file type: {error}"],
            processing_notes=["File type not supported for processing"]
        )
    
    def _infer_schema(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Infer schema from DataFrame"""
        return {
            "columns": df.columns.tolist(),
            "dtypes": df.dtypes.astype(str).to_dict(),
            "shape": df.shape,
            "memory_usage": df.memory_usage(deep=True).sum()
        }
    
    def _infer_json_schema(self, data: Any) -> Dict[str, Any]:
        """Basic JSON schema inference"""
        if isinstance(data, dict):
            return {"type": "object", "keys": list(data.keys())}
        elif isinstance(data, list):
            return {"type": "array", "length": len(data)}
        else:
            return {"type": type(data).__name__}
    
    def _extract_basic_metadata(self, df: pd.DataFrame, filepath: str) -> Dict[str, Any]:
        """Extract basic metadata from DataFrame"""
        import os
        return {
            "file_path": filepath,
            "file_size": os.path.getsize(filepath),
            "rows": len(df),
            "columns": len(df.columns),
            "missing_values": df.isnull().sum().sum(),
            "duplicates": df.duplicated().sum()
        }
    
    def _validate_ml_readiness(self, df: pd.DataFrame) -> List[str]:
        """Validate if data is ready for ML"""
        errors = []
        
        if len(df) < 10:
            errors.append("Dataset too small (minimum 10 rows required)")
        
        if len(df.columns) < 2:
            errors.append("Dataset needs at least 2 columns (features + target)")
        
        missing_ratio = df.isnull().sum().sum() / (len(df) * len(df.columns))
        if missing_ratio > 0.5:
            errors.append("Too many missing values (>50%)")
        
        return errors