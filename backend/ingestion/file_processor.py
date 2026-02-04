"""
Mature File Ingestion System
Separates ingestion → normalization → intelligence layers
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import pandas as pd
import json
import os

class ProcessingDepth(Enum):
    FULL_ML = "FULL_ML"
    PARTIAL_ANALYSIS = "PARTIAL_ANALYSIS"
    METADATA_ONLY = "METADATA_ONLY"

class FileFormat(Enum):
    CSV = "csv"
    XLSX = "xlsx" 
    JSON = "json"
    PDF = "pdf"
    DOCX = "docx"
    UNKNOWN = "unknown"

@dataclass
class IngestionResult:
    file_format: FileFormat
    processing_depth: ProcessingDepth
    success: bool
    dataframe: Optional[pd.DataFrame] = None
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    schema_summary: Optional[Dict[str, Any]] = None
    ml_readiness_score: Optional[float] = None
    file_size_bytes: int = 0
    error_message: Optional[str] = None

class FileIngestionEngine:
    FORMAT_CAPABILITIES = {
        FileFormat.CSV: ProcessingDepth.FULL_ML,
        FileFormat.XLSX: ProcessingDepth.FULL_ML,
        FileFormat.JSON: ProcessingDepth.PARTIAL_ANALYSIS,
        FileFormat.PDF: ProcessingDepth.METADATA_ONLY,
        FileFormat.DOCX: ProcessingDepth.METADATA_ONLY,
        FileFormat.UNKNOWN: ProcessingDepth.METADATA_ONLY
    }
    
    def ingest_file(self, filepath: str) -> IngestionResult:
        file_format = self._detect_format(filepath)
        max_depth = self.FORMAT_CAPABILITIES[file_format]
        file_size = os.path.getsize(filepath)
        
        try:
            if max_depth == ProcessingDepth.FULL_ML:
                result = self._process_full_ml(filepath, file_format)
            elif max_depth == ProcessingDepth.PARTIAL_ANALYSIS:
                result = self._process_partial_analysis(filepath, file_format)
            else:
                result = self._process_metadata_only(filepath, file_format)
            
            result.file_size_bytes = file_size
            result.success = True
            return result
            
        except Exception as e:
            return IngestionResult(
                file_format=file_format,
                processing_depth=ProcessingDepth.METADATA_ONLY,
                success=False,
                file_size_bytes=file_size,
                error_message=str(e)
            )
    
    def _detect_format(self, filepath: str) -> FileFormat:
        ext = filepath.lower().split('.')[-1]
        format_map = {
            'csv': FileFormat.CSV,
            'xlsx': FileFormat.XLSX,
            'json': FileFormat.JSON,
            'pdf': FileFormat.PDF,
            'docx': FileFormat.DOCX
        }
        return format_map.get(ext, FileFormat.UNKNOWN)
    
    def _process_full_ml(self, filepath: str, file_format: FileFormat) -> IngestionResult:
        if file_format == FileFormat.CSV:
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        schema = self._extract_schema(df)
        ml_score = self._assess_ml_readiness(df)
        
        return IngestionResult(
            file_format=file_format,
            processing_depth=ProcessingDepth.FULL_ML,
            success=True,
            dataframe=df,
            row_count=len(df),
            column_count=len(df.columns),
            schema_summary=schema,
            ml_readiness_score=ml_score
        )
    
    def _process_partial_analysis(self, filepath: str, file_format: FileFormat) -> IngestionResult:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        df = None
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            try:
                df = pd.DataFrame(data)
            except:
                pass
        
        return IngestionResult(
            file_format=file_format,
            processing_depth=ProcessingDepth.PARTIAL_ANALYSIS,
            success=True,
            dataframe=df,
            row_count=len(df) if df is not None else None,
            column_count=len(df.columns) if df is not None else None
        )
    
    def _process_metadata_only(self, filepath: str, file_format: FileFormat) -> IngestionResult:
        return IngestionResult(
            file_format=file_format,
            processing_depth=ProcessingDepth.METADATA_ONLY,
            success=True
        )
    
    def _extract_schema(self, df: pd.DataFrame) -> Dict[str, Any]:
        return {
            'columns': df.columns.tolist(),
            'types': df.dtypes.astype(str).to_dict(),
            'shape': df.shape
        }
    
    def _assess_ml_readiness(self, df: pd.DataFrame) -> float:
        score = 100.0
        if len(df) < 100:
            score -= 30
        missing_ratio = df.isnull().sum().sum() / df.size
        score -= missing_ratio * 40
        return max(0, score)

ingestion_engine = FileIngestionEngine()